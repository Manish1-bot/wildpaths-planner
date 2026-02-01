import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import * as turf from '@turf/turf';

export interface TreeDataset {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  dataset_type: 'trees_before' | 'development_layer';
  geojson_data: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface TreeAnalysisResult {
  id: string;
  project_id: string;
  user_id: string;
  trees_dataset_id: string | null;
  development_dataset_id: string | null;
  total_trees: number;
  affected_trees: number;
  safe_trees: number;
  tree_loss_percentage: number;
  buffer_meters: number;
  affected_geojson: any;
  safe_geojson: any;
  summary: any;
  created_at: string;
}

export function useTreeDatasets(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const datasetsQuery = useQuery({
    queryKey: ['tree-datasets', projectId],
    queryFn: async (): Promise<TreeDataset[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('tree_datasets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        dataset_type: d.dataset_type as 'trees_before' | 'development_layer',
      }));
    },
    enabled: !!projectId && !!user,
  });

  const uploadTreeDataset = useMutation({
    mutationFn: async ({ 
      file, 
      projectId, 
      datasetType 
    }: { 
      file: File; 
      projectId: string; 
      datasetType: 'trees_before' | 'development_layer';
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const text = await file.text();
      let geojsonData: any;

      if (file.name.endsWith('.csv')) {
        geojsonData = parseCSVToGeoJSON(text);
      } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        geojsonData = JSON.parse(text);
      } else {
        throw new Error('Unsupported file format. Please upload GeoJSON or CSV.');
      }

      const { data, error } = await supabase
        .from('tree_datasets')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          dataset_type: datasetType,
          geojson_data: geojsonData,
          metadata: {
            feature_count: geojsonData.features?.length || 0,
            uploaded_at: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tree-datasets'] });
      toast({
        title: 'Dataset uploaded',
        description: `${variables.datasetType === 'trees_before' ? 'Tree' : 'Development'} data uploaded successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTreeDataset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tree_datasets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-datasets'] });
      toast({
        title: 'Dataset deleted',
        description: 'The dataset has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    treeDatasets: datasetsQuery.data || [],
    isLoading: datasetsQuery.isLoading,
    error: datasetsQuery.error,
    uploadTreeDataset,
    deleteTreeDataset,
  };
}

export function useTreeAnalysisResults(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resultsQuery = useQuery({
    queryKey: ['tree-analysis-results', projectId],
    queryFn: async (): Promise<TreeAnalysisResult[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('tree_analysis_results')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!user,
  });

  const runTreeImpactAnalysis = useMutation({
    mutationFn: async ({ 
      projectId, 
      treesDatasetId, 
      developmentDatasetId,
      treesData,
      developmentData,
      bufferMeters = 50,
    }: { 
      projectId: string; 
      treesDatasetId: string;
      developmentDatasetId: string;
      treesData: any;
      developmentData: any;
      bufferMeters?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Perform spatial analysis
      const analysis = performTreeImpactAnalysis(treesData, developmentData, bufferMeters);

      // Store results
      const { data, error } = await supabase
        .from('tree_analysis_results')
        .insert({
          project_id: projectId,
          user_id: user.id,
          trees_dataset_id: treesDatasetId,
          development_dataset_id: developmentDatasetId,
          total_trees: analysis.totalTrees,
          affected_trees: analysis.affectedTrees,
          safe_trees: analysis.safeTrees,
          tree_loss_percentage: analysis.treeLossPercentage,
          buffer_meters: bufferMeters,
          affected_geojson: analysis.affectedGeoJSON,
          safe_geojson: analysis.safeGeoJSON,
          summary: analysis.summary,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-analysis-results'] });
      toast({
        title: 'Analysis complete',
        description: 'Tree impact analysis has been completed successfully.',
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

  const deleteTreeAnalysisResult = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tree_analysis_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-analysis-results'] });
      toast({
        title: 'Result deleted',
        description: 'The analysis result has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    analysisResults: resultsQuery.data || [],
    isLoading: resultsQuery.isLoading,
    error: resultsQuery.error,
    runTreeImpactAnalysis,
    deleteTreeAnalysisResult,
  };
}

// Parse CSV to GeoJSON
function parseCSVToGeoJSON(csvText: string): any {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const latIndex = headers.findIndex(h => h === 'latitude' || h === 'lat' || h === 'y');
  const lonIndex = headers.findIndex(h => h === 'longitude' || h === 'lon' || h === 'lng' || h === 'x');

  if (latIndex === -1 || lonIndex === -1) {
    throw new Error('CSV must contain latitude and longitude columns');
  }

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const lat = parseFloat(values[latIndex]);
    const lon = parseFloat(values[lonIndex]);

    if (isNaN(lat) || isNaN(lon)) continue;

    const properties: Record<string, any> = {};
    headers.forEach((header, idx) => {
      if (idx !== latIndex && idx !== lonIndex) {
        properties[header] = values[idx];
      }
    });

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lon, lat],
      },
      properties,
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

// Perform tree impact analysis using Turf.js
function performTreeImpactAnalysis(
  treesData: any,
  developmentData: any,
  bufferMeters: number
): {
  totalTrees: number;
  affectedTrees: number;
  safeTrees: number;
  treeLossPercentage: number;
  affectedGeoJSON: any;
  safeGeoJSON: any;
  summary: any;
} {
  // Extract tree points
  const treePoints = treesData.features?.filter(
    (f: any) => f.geometry?.type === 'Point'
  ) || [];

  if (treePoints.length === 0) {
    throw new Error('No tree point data found in the trees dataset');
  }

  // Create buffer around development features
  const developmentFeatures = developmentData.features || [];
  let combinedBuffer: any = null;

  for (const feature of developmentFeatures) {
    if (!feature.geometry) continue;

    try {
      // Convert meters to kilometers for Turf.js
      const buffered = turf.buffer(feature, bufferMeters / 1000, { units: 'kilometers' });
      if (buffered) {
        if (!combinedBuffer) {
          combinedBuffer = buffered;
        } else {
          combinedBuffer = turf.union(
            turf.featureCollection([combinedBuffer, buffered])
          );
        }
      }
    } catch (e) {
      console.warn('Error buffering feature:', e);
    }
  }

  if (!combinedBuffer) {
    throw new Error('Could not create buffer zone from development data');
  }

  // Classify trees
  const affectedFeatures: any[] = [];
  const safeFeatures: any[] = [];

  for (const tree of treePoints) {
    try {
      const isAffected = turf.booleanPointInPolygon(tree, combinedBuffer);
      if (isAffected) {
        affectedFeatures.push({
          ...tree,
          properties: {
            ...tree.properties,
            impact_status: 'affected',
          },
        });
      } else {
        safeFeatures.push({
          ...tree,
          properties: {
            ...tree.properties,
            impact_status: 'safe',
          },
        });
      }
    } catch (e) {
      // If check fails, assume safe
      safeFeatures.push({
        ...tree,
        properties: {
          ...tree.properties,
          impact_status: 'safe',
        },
      });
    }
  }

  const totalTrees = treePoints.length;
  const affectedTrees = affectedFeatures.length;
  const safeTrees = safeFeatures.length;
  const treeLossPercentage = totalTrees > 0 
    ? Math.round((affectedTrees / totalTrees) * 10000) / 100 
    : 0;

  // Generate summary and recommendations
  const summary = {
    analysis_date: new Date().toISOString(),
    buffer_zone_meters: bufferMeters,
    development_features: developmentFeatures.length,
    impact_level: treeLossPercentage > 30 ? 'Severe' : 
                  treeLossPercentage > 15 ? 'High' : 
                  treeLossPercentage > 5 ? 'Moderate' : 'Low',
    recommendations: generateRecommendations(treeLossPercentage, affectedTrees),
  };

  return {
    totalTrees,
    affectedTrees,
    safeTrees,
    treeLossPercentage,
    affectedGeoJSON: {
      type: 'FeatureCollection',
      features: affectedFeatures,
    },
    safeGeoJSON: {
      type: 'FeatureCollection',
      features: safeFeatures,
    },
    summary,
  };
}

function generateRecommendations(lossPercentage: number, affectedCount: number): string[] {
  const recommendations: string[] = [];

  if (lossPercentage > 30) {
    recommendations.push('Consider relocating or rerouting the development to reduce environmental impact.');
    recommendations.push('Conduct a detailed environmental impact assessment before proceeding.');
  } else if (lossPercentage > 15) {
    recommendations.push('Explore alternative corridor designs to minimize tree loss.');
    recommendations.push('Implement a tree replanting program at a 2:1 ratio.');
  } else if (lossPercentage > 5) {
    recommendations.push('Proceed with development while implementing mitigation measures.');
    recommendations.push('Consider transplanting mature trees where feasible.');
  } else {
    recommendations.push('Development has minimal environmental impact on tree coverage.');
    recommendations.push('Monitor affected areas for any secondary impacts.');
  }

  if (affectedCount > 100) {
    recommendations.push('Develop a phased clearing plan to minimize immediate ecological disruption.');
  }

  recommendations.push('Document all affected trees with species and size data for regulatory compliance.');

  return recommendations;
}
