import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export interface Dataset {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  file_type: string;
  file_url: string | null;
  geojson_data: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export function useDatasets(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const datasetsQuery = useQuery({
    queryKey: ['datasets', projectId],
    queryFn: async (): Promise<Dataset[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId && !!user,
  });

  const uploadDataset = useMutation({
    mutationFn: async ({ file, projectId }: { file: File; projectId: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Read file content
      const content = await file.text();
      let geojsonData = null;
      let fileType = 'unknown';
      
      // Determine file type and parse
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        fileType = 'geojson';
        try {
          geojsonData = JSON.parse(content);
        } catch (e) {
          throw new Error('Invalid GeoJSON file');
        }
      } else if (file.name.endsWith('.csv')) {
        fileType = 'csv';
        // Convert CSV to GeoJSON if it has lat/lng columns
        geojsonData = csvToGeoJSON(content);
      }

      // Try to send to Python API first
      const apiResult = await api.uploadGIS(file, projectId);
      
      // Store in database
      const { data, error } = await supabase
        .from('datasets')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          file_type: fileType,
          geojson_data: geojsonData,
          metadata: {
            size: file.size,
            api_processed: !apiResult.error,
            api_result: apiResult.data,
          },
        })
        .select()
        .single();

      if (error) throw error;
      return { dataset: data, apiResult };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast({
        title: 'Dataset uploaded',
        description: 'Your data has been uploaded and is ready for analysis.',
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

  const deleteDataset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] });
      toast({
        title: 'Dataset deleted',
        description: 'The dataset has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete dataset',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    datasets: datasetsQuery.data || [],
    isLoading: datasetsQuery.isLoading,
    error: datasetsQuery.error,
    uploadDataset,
    deleteDataset,
  };
}

// Helper function to convert CSV with lat/lng to GeoJSON
function csvToGeoJSON(csvContent: string): any {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return null;
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const latIdx = headers.findIndex(h => ['latitude', 'lat', 'y'].includes(h));
  const lngIdx = headers.findIndex(h => ['longitude', 'lng', 'lon', 'long', 'x'].includes(h));
  
  if (latIdx === -1 || lngIdx === -1) return null;
  
  const features = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const lat = parseFloat(values[latIdx]);
    const lng = parseFloat(values[lngIdx]);
    
    if (isNaN(lat) || isNaN(lng)) continue;
    
    const properties: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (idx !== latIdx && idx !== lngIdx) {
        properties[header] = values[idx];
      }
    });
    
    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties,
    });
  }
  
  return {
    type: 'FeatureCollection',
    features,
  };
}
