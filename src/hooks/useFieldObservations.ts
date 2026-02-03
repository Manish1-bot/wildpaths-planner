import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type ObservationType = 'wildlife_sighting' | 'habitat_area' | 'risk_zone' | 'infrastructure' | 'corridor_suggestion' | 'tree_observation';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface FieldObservation {
  id: string;
  project_id: string;
  user_id: string;
  observation_type: ObservationType;
  latitude: number;
  longitude: number;
  title: string;
  description: string | null;
  habitat_type: string | null;
  species_observed: string[] | null;
  risk_level: RiskLevel | null;
  infrastructure_type: string | null;
  photo_urls: string[] | null;
  metadata: Record<string, any>;
  verified: boolean;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateObservationInput {
  project_id: string;
  observation_type: ObservationType;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  habitat_type?: string;
  species_observed?: string[];
  risk_level?: RiskLevel;
  infrastructure_type?: string;
  photo_urls?: string[];
  metadata?: Record<string, any>;
}

export function useFieldObservations(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const observationsQuery = useQuery({
    queryKey: ['field-observations', projectId],
    queryFn: async (): Promise<FieldObservation[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('field_observations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as FieldObservation[];
    },
    enabled: !!projectId && !!user,
  });

  const createObservation = useMutation({
    mutationFn: async (input: CreateObservationInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('field_observations')
        .insert({
          ...input,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-observations', projectId] });
      toast({
        title: 'Observation saved',
        description: 'Your field observation has been recorded.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save observation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateObservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FieldObservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('field_observations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-observations', projectId] });
      toast({
        title: 'Observation updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update observation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteObservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('field_observations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-observations', projectId] });
      toast({
        title: 'Observation deleted',
        description: 'The observation has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete observation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Convert observations to GeoJSON
  const observationsAsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: (observationsQuery.data || []).map(obs => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [obs.longitude, obs.latitude],
      },
      properties: {
        id: obs.id,
        title: obs.title,
        description: obs.description,
        observation_type: obs.observation_type,
        habitat_type: obs.habitat_type,
        species_observed: obs.species_observed,
        risk_level: obs.risk_level,
        infrastructure_type: obs.infrastructure_type,
        verified: obs.verified,
        created_at: obs.created_at,
      },
    })),
  };

  return {
    observations: observationsQuery.data || [],
    observationsAsGeoJSON,
    isLoading: observationsQuery.isLoading,
    error: observationsQuery.error,
    createObservation,
    updateObservation,
    deleteObservation,
  };
}
