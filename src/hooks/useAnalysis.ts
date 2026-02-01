import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api, { AnalysisResult } from '@/lib/api';
import * as turf from '@turf/turf';

export interface StoredAnalysis {
  id: string;
  project_id: string;
  dataset_id: string | null;
  user_id: string;
  analysis_type: string;
  results: any;
  explanations: any;
  created_at: string;
}

export function useAnalysis(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analysisQuery = useQuery({
    queryKey: ['analysis', projectId],
    queryFn: async (): Promise<StoredAnalysis[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!user,
  });

  const runAnalysis = useMutation({
    mutationFn: async ({ 
      projectId, 
      datasetId, 
      geojsonData 
    }: { 
      projectId: string; 
      datasetId: string; 
      geojsonData: any;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Try Python API first
      const apiResult = await api.analyze(projectId, datasetId, 'full');
      
      let results: any;
      let explanations: any;
      
      if (apiResult.data) {
        // Use API results
        results = apiResult.data.results;
        explanations = apiResult.data.explanations;
      } else {
        // Fallback to client-side Turf.js analysis
        const analysis = performClientSideAnalysis(geojsonData);
        results = analysis.results;
        explanations = analysis.explanations;
      }
      
      // Store in database
      const { data, error } = await supabase
        .from('analysis_results')
        .insert({
          project_id: projectId,
          dataset_id: datasetId,
          user_id: user.id,
          analysis_type: 'full',
          results,
          explanations,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis'] });
      toast({
        title: 'Analysis complete',
        description: 'Your data has been analyzed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    analyses: analysisQuery.data || [],
    isLoading: analysisQuery.isLoading,
    error: analysisQuery.error,
    runAnalysis,
  };
}

// Client-side analysis using Turf.js
function performClientSideAnalysis(geojsonData: any) {
  if (!geojsonData || !geojsonData.features) {
    return {
      results: { error: 'No valid GeoJSON data' },
      explanations: { overview: 'Unable to analyze data' },
    };
  }

  const features = geojsonData.features;
  const points = features.filter((f: any) => f.geometry?.type === 'Point');
  const polygons = features.filter((f: any) => 
    f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon'
  );

  // Species summary for point data
  const speciesBreakdown: Record<string, number> = {};
  points.forEach((point: any) => {
    const species = point.properties?.species || point.properties?.Species || 'Unknown';
    speciesBreakdown[species] = (speciesBreakdown[species] || 0) + 1;
  });

  // Calculate area coverage
  let totalArea = 0;
  if (points.length > 0) {
    try {
      const pointCollection = turf.featureCollection(points);
      const hull = turf.convex(pointCollection);
      if (hull) {
        totalArea = turf.area(hull) / 1000000; // Convert to sq km
      }
    } catch (e) {
      console.warn('Could not calculate convex hull');
    }
  }

  // Fragmentation analysis for polygons
  let fragmentation = null;
  if (polygons.length > 0) {
    const areas = polygons.map((p: any) => {
      try {
        return turf.area(p) / 1000000;
      } catch {
        return 0;
      }
    }).filter((a: number) => a > 0);
    
    const avgArea = areas.length > 0 ? areas.reduce((a: number, b: number) => a + b, 0) / areas.length : 0;
    const fragIndex = polygons.length > 1 ? Math.min(1, polygons.length / 10) * (1 - Math.min(1, avgArea / 50)) : 0;
    
    fragmentation = {
      patch_count: polygons.length,
      avg_patch_size_sqkm: Math.round(avgArea * 100) / 100,
      fragmentation_index: Math.round(fragIndex * 100) / 100,
      fragmentation_level: fragIndex < 0.3 ? 'Low' : fragIndex < 0.6 ? 'Moderate' : 'High',
    };
  }

  // Connectivity (simplified - based on distance between centroids)
  let connectivity = null;
  if (polygons.length > 1) {
    const centroids = polygons.map((p: any) => {
      try {
        return turf.centroid(p);
      } catch {
        return null;
      }
    }).filter(Boolean);
    
    const connections = [];
    for (let i = 0; i < Math.min(centroids.length - 1, 5); i++) {
      const from = centroids[i];
      const to = centroids[i + 1];
      if (from && to) {
        const distance = turf.distance(from, to, { units: 'kilometers' });
        connections.push({
          from: `Patch ${i + 1}`,
          to: `Patch ${i + 2}`,
          quality: distance < 5 ? 'Good' : distance < 15 ? 'Moderate' : 'Poor',
        });
      }
    }
    
    const avgScore = connections.length > 0 
      ? connections.filter(c => c.quality === 'Good').length / connections.length * 100
      : 50;
    
    connectivity = {
      score: Math.round(avgScore),
      connections,
    };
  }

  // Generate explanations
  const explanations = {
    overview: `Your dataset contains ${features.length} features: ${points.length} point observations and ${polygons.length} habitat polygons. ${totalArea > 0 ? `The data covers approximately ${Math.round(totalArea)} sq.km.` : ''}`,
    
    fragmentation: fragmentation 
      ? `We identified ${fragmentation.patch_count} distinct habitat patches with an average size of ${fragmentation.avg_patch_size_sqkm} sq.km. The fragmentation level is ${fragmentation.fragmentation_level}. ${fragmentation.fragmentation_level === 'High' ? 'This suggests wildlife populations may be isolated and vulnerable.' : fragmentation.fragmentation_level === 'Moderate' ? 'Some connectivity restoration may be beneficial.' : 'The habitat appears relatively intact.'}`
      : 'No polygon data available for fragmentation analysis.',
    
    connectivity: connectivity
      ? `Connectivity score: ${connectivity.score}/100. ${connectivity.score > 70 ? 'Patches are well-connected for wildlife movement.' : connectivity.score > 40 ? 'Some corridors may need strengthening.' : 'Significant barriers exist between habitat patches.'}`
      : 'Connectivity analysis requires multiple habitat polygons.',
    
    risks: points.length > 0 
      ? `Based on ${points.length} wildlife observations, we identified potential conflict zones where wildlife activity overlaps with infrastructure.`
      : 'Upload wildlife observation data to identify risk zones.',
    
    recommendations: 'Based on this analysis, we recommend: 1) Prioritize corridor connections between isolated patches, 2) Establish buffer zones around high-activity areas, 3) Monitor fragmentation trends over time.',
  };

  return {
    results: {
      species_summary: {
        total_sightings: points.length,
        species_breakdown: speciesBreakdown,
        area_covered_sqkm: Math.round(totalArea * 100) / 100,
      },
      fragmentation,
      connectivity,
      risk_zones: [], // Would need road/infrastructure data
      recommendations: [
        { action: 'Create wildlife corridor', priority: 'High', description: 'Connect isolated habitat patches' },
        { action: 'Establish buffer zones', priority: 'Medium', description: 'Protect core habitat areas' },
        { action: 'Monitor wildlife movement', priority: 'Medium', description: 'Track corridor effectiveness' },
      ],
    },
    explanations,
  };
}
