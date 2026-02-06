import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ImpactCriteria {
  distance_weight: number;
  root_damage_weight: number;
  shadow_loss_weight: number;
  species_sensitivity_weight: number;
  tree_health_weight: number;
}

export interface SpeciesBreakdown {
  [species: string]: {
    total: number;
    affected: number;
    safe: number;
    direct_removal: number;
    high_impact: number;
    medium_impact: number;
  };
}

export interface MitigationMeasure {
  id: string;
  type: 'transplant' | 'protection' | 'replacement' | 'monitoring' | 'restoration';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimated_cost: number;
  affected_trees: number;
  timeline_weeks: number;
}

export interface ImpactAnalysis {
  id: string;
  project_id: string;
  corridor_id: string | null;
  analysis_name: string;
  buffer_distance_m: number;
  root_zone_multiplier: number;
  season: string;
  impact_criteria: ImpactCriteria | null;
  total_trees: number;
  affected_trees: number;
  safe_trees: number;
  direct_removal: number;
  high_impact: number;
  medium_impact: number;
  impact_percentage: number;
  by_species: SpeciesBreakdown | null;
  by_size: Record<string, number> | null;
  by_health: Record<string, number> | null;
  spatial_distribution: any | null;
  mitigation_measures: MitigationMeasure[] | null;
  total_compensation: number | null;
  implementation_cost: number | null;
  report_url: string | null;
  report_data: any | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateImpactAnalysisInput {
  project_id: string;
  corridor_id?: string;
  analysis_name: string;
  buffer_distance_m?: number;
  root_zone_multiplier?: number;
  season?: string;
  impact_criteria?: ImpactCriteria;
  total_trees: number;
  affected_trees: number;
  safe_trees: number;
  direct_removal?: number;
  high_impact?: number;
  medium_impact?: number;
  impact_percentage: number;
  by_species?: SpeciesBreakdown;
  by_size?: Record<string, number>;
  by_health?: Record<string, number>;
  spatial_distribution?: any;
  mitigation_measures?: MitigationMeasure[];
  total_compensation?: number;
  implementation_cost?: number;
  report_data?: any;
}

export const DEFAULT_IMPACT_CRITERIA: ImpactCriteria = {
  distance_weight: 0.30,
  root_damage_weight: 0.25,
  shadow_loss_weight: 0.20,
  species_sensitivity_weight: 0.15,
  tree_health_weight: 0.10,
};

export function useImpactAnalyses(projectId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analysesQuery = useQuery({
    queryKey: ['impact-analyses', projectId],
    queryFn: async (): Promise<ImpactAnalysis[]> => {
      if (!projectId || !user) return [];
      
      const { data, error } = await supabase
        .from('impact_analyses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        impact_criteria: d.impact_criteria as unknown as ImpactCriteria | null,
        by_species: d.by_species as unknown as SpeciesBreakdown | null,
        by_size: d.by_size as unknown as Record<string, number> | null,
        by_health: d.by_health as unknown as Record<string, number> | null,
        mitigation_measures: d.mitigation_measures as unknown as MitigationMeasure[] | null,
      }));
    },
    enabled: !!projectId && !!user,
  });

  const createAnalysis = useMutation({
    mutationFn: async (input: CreateImpactAnalysisInput) => {
      if (!user) throw new Error('Not authenticated');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        project_id: input.project_id,
        corridor_id: input.corridor_id || null,
        analysis_name: input.analysis_name,
        buffer_distance_m: input.buffer_distance_m ?? 100,
        root_zone_multiplier: input.root_zone_multiplier ?? 1.5,
        season: input.season ?? 'summer',
        impact_criteria: input.impact_criteria || null,
        total_trees: input.total_trees,
        affected_trees: input.affected_trees,
        safe_trees: input.safe_trees,
        direct_removal: input.direct_removal ?? 0,
        high_impact: input.high_impact ?? 0,
        medium_impact: input.medium_impact ?? 0,
        impact_percentage: input.impact_percentage,
        by_species: input.by_species || null,
        by_size: input.by_size || null,
        by_health: input.by_health || null,
        spatial_distribution: input.spatial_distribution || null,
        mitigation_measures: input.mitigation_measures || null,
        total_compensation: input.total_compensation ?? 0,
        implementation_cost: input.implementation_cost ?? 0,
        report_data: input.report_data || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from('impact_analyses')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-analyses', projectId] });
      toast({
        title: 'Analysis saved',
        description: 'Impact analysis results have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save analysis',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateAnalysis = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ImpactAnalysis> & { id: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...updates };
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.user_id;
      
      const { data, error } = await supabase
        .from('impact_analyses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-analyses', projectId] });
      toast({
        title: 'Analysis updated',
        description: 'Changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update analysis',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAnalysis = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('impact_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['impact-analyses', projectId] });
      toast({
        title: 'Analysis deleted',
        description: 'The analysis has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete analysis',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    analyses: analysesQuery.data || [],
    latestAnalysis: analysesQuery.data?.[0],
    isLoading: analysesQuery.isLoading,
    error: analysesQuery.error,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
  };
}
