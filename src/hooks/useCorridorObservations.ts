import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type CorridorType = 'proposed' | 'existing' | 'alternative';
export type CorridorPriority = 'low' | 'medium' | 'high' | 'critical';
export type CorridorStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export interface CorridorObservation {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  description: string | null;
  corridor_type: CorridorType | null;
  geojson_data: any;
  width_meters: number;
  priority: CorridorPriority | null;
  target_species: string[] | null;
  connectivity_notes: string | null;
  risk_factors: string[] | null;
  status: CorridorStatus;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateCorridorInput {
  project_id: string;
  name: string;
  description?: string;
  corridor_type?: CorridorType;
  geojson_data: any;
  width_meters?: number;
  priority?: CorridorPriority;
  target_species?: string[];
  connectivity_notes?: string;
  risk_factors?: string[];
  metadata?: Record<string, any>;
}

export function useCorridorObservations(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const corridorsQuery = useQuery({
    queryKey: ['corridor-observations', projectId],
    queryFn: async (): Promise<CorridorObservation[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('corridor_observations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as CorridorObservation[];
    },
    enabled: !!projectId && !!user,
  });

  const createCorridor = useMutation({
    mutationFn: async (input: CreateCorridorInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('corridor_observations')
        .insert({
          ...input,
          user_id: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corridor-observations', projectId] });
      toast({
        title: 'Corridor saved',
        description: 'Your corridor design has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save corridor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateCorridor = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CorridorObservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('corridor_observations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corridor-observations', projectId] });
      toast({
        title: 'Corridor updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update corridor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteCorridor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('corridor_observations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corridor-observations', projectId] });
      toast({
        title: 'Corridor deleted',
        description: 'The corridor design has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete corridor',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get combined GeoJSON of all corridors
  const corridorsAsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: (corridorsQuery.data || []).flatMap(corridor => {
      if (!corridor.geojson_data) return [];
      const data = corridor.geojson_data;
      if (data.type === 'FeatureCollection') {
        return data.features.map((f: any) => ({
          ...f,
          properties: {
            ...f.properties,
            corridor_id: corridor.id,
            corridor_name: corridor.name,
            corridor_type: corridor.corridor_type,
            priority: corridor.priority,
            status: corridor.status,
          },
        }));
      } else if (data.type === 'Feature') {
        return [{
          ...data,
          properties: {
            ...data.properties,
            corridor_id: corridor.id,
            corridor_name: corridor.name,
            corridor_type: corridor.corridor_type,
            priority: corridor.priority,
            status: corridor.status,
          },
        }];
      }
      return [];
    }),
  };

  return {
    corridors: corridorsQuery.data || [],
    corridorsAsGeoJSON,
    isLoading: corridorsQuery.isLoading,
    error: corridorsQuery.error,
    createCorridor,
    updateCorridor,
    deleteCorridor,
  };
}
