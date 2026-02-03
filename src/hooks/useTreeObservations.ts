import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type HealthStatus = 'excellent' | 'good' | 'fair' | 'poor' | 'dead';
export type ImpactStatus = 'safe' | 'at_risk' | 'affected' | 'removed' | 'transplanted';

export interface TreeObservation {
  id: string;
  project_id: string;
  user_id: string;
  tree_id: string | null;
  latitude: number;
  longitude: number;
  species: string | null;
  height_meters: number | null;
  age_years: number | null;
  health_status: HealthStatus | null;
  canopy_diameter_meters: number | null;
  trunk_diameter_cm: number | null;
  photo_urls: string[] | null;
  notes: string | null;
  impact_status: ImpactStatus | null;
  impact_reason: string | null;
  metadata: Record<string, any>;
  observation_date: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTreeInput {
  project_id: string;
  latitude: number;
  longitude: number;
  tree_id?: string;
  species?: string;
  height_meters?: number;
  age_years?: number;
  health_status?: HealthStatus;
  canopy_diameter_meters?: number;
  trunk_diameter_cm?: number;
  photo_urls?: string[];
  notes?: string;
  impact_status?: ImpactStatus;
  impact_reason?: string;
  metadata?: Record<string, any>;
}

export function useTreeObservations(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const treesQuery = useQuery({
    queryKey: ['tree-observations', projectId],
    queryFn: async (): Promise<TreeObservation[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('tree_observations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TreeObservation[];
    },
    enabled: !!projectId && !!user,
  });

  const createTree = useMutation({
    mutationFn: async (input: CreateTreeInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tree_observations')
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
      queryClient.invalidateQueries({ queryKey: ['tree-observations', projectId] });
      toast({
        title: 'Tree recorded',
        description: 'Your tree observation has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save tree',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTree = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TreeObservation> & { id: string }) => {
      const { data, error } = await supabase
        .from('tree_observations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-observations', projectId] });
      toast({
        title: 'Tree updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update tree',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTree = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tree_observations')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tree-observations', projectId] });
      toast({
        title: 'Tree deleted',
        description: 'The tree observation has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete tree',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Convert trees to GeoJSON
  const treesAsGeoJSON = {
    type: 'FeatureCollection' as const,
    features: (treesQuery.data || []).map(tree => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [tree.longitude, tree.latitude],
      },
      properties: {
        id: tree.id,
        tree_id: tree.tree_id,
        species: tree.species,
        height_meters: tree.height_meters,
        age_years: tree.age_years,
        health_status: tree.health_status,
        canopy_diameter_meters: tree.canopy_diameter_meters,
        trunk_diameter_cm: tree.trunk_diameter_cm,
        impact_status: tree.impact_status,
        impact_reason: tree.impact_reason,
        observation_date: tree.observation_date,
      },
    })),
  };

  // Get statistics
  const stats = {
    total: treesQuery.data?.length || 0,
    bySpecies: Object.entries(
      (treesQuery.data || []).reduce((acc, tree) => {
        const species = tree.species || 'Unknown';
        acc[species] = (acc[species] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]),
    byHealth: Object.entries(
      (treesQuery.data || []).reduce((acc, tree) => {
        const health = tree.health_status || 'Unknown';
        acc[health] = (acc[health] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
    byImpact: Object.entries(
      (treesQuery.data || []).reduce((acc, tree) => {
        const impact = tree.impact_status || 'Unknown';
        acc[impact] = (acc[impact] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
  };

  return {
    trees: treesQuery.data || [],
    treesAsGeoJSON,
    stats,
    isLoading: treesQuery.isLoading,
    error: treesQuery.error,
    createTree,
    updateTree,
    deleteTree,
  };
}
