import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface LandTypeCost {
  dense_forest: number;
  open_forest: number;
  grassland: number;
  scrubland: number;
  agriculture: number;
  river_creek: number;
  highway: number;
  village_road: number;
  human_settlement: number;
  water_body: number;
  [key: string]: number;
}

export interface ResistanceTemplate {
  id: string;
  name: string;
  species_name: string | null;
  species_scientific: string | null;
  land_type_costs: LandTypeCost;
  description: string | null;
  is_default: boolean;
  user_id: string;
  created_at: string;
}

export interface CreateResistanceTemplateInput {
  name: string;
  species_name?: string;
  species_scientific?: string;
  land_type_costs: LandTypeCost;
  description?: string;
  is_default?: boolean;
}

export const DEFAULT_LAND_TYPES = [
  { key: 'dense_forest', label: 'Dense Forest', color: '#166534', defaultCost: 1 },
  { key: 'open_forest', label: 'Open Forest', color: '#22c55e', defaultCost: 3 },
  { key: 'grassland', label: 'Grassland', color: '#84cc16', defaultCost: 5 },
  { key: 'scrubland', label: 'Scrubland', color: '#a3a314', defaultCost: 8 },
  { key: 'agriculture', label: 'Agriculture', color: '#eab308', defaultCost: 15 },
  { key: 'river_creek', label: 'River/Creek', color: '#0ea5e9', defaultCost: 3 },
  { key: 'highway', label: 'Highway (4-lane)', color: '#dc2626', defaultCost: 100 },
  { key: 'village_road', label: 'Village Road', color: '#f97316', defaultCost: 30 },
  { key: 'human_settlement', label: 'Human Settlement', color: '#7c3aed', defaultCost: 200 },
  { key: 'water_body', label: 'Water Body (Lake)', color: '#1d4ed8', defaultCost: 1000 },
];

export function useResistanceTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ['resistance-templates'],
    queryFn: async (): Promise<ResistanceTemplate[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('resistance_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        land_type_costs: d.land_type_costs as LandTypeCost,
      }));
    },
    enabled: !!user,
  });

  const createTemplate = useMutation({
    mutationFn: async (input: CreateResistanceTemplateInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('resistance_templates')
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
      queryClient.invalidateQueries({ queryKey: ['resistance-templates'] });
      toast({
        title: 'Template saved',
        description: 'Resistance matrix template has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ResistanceTemplate> & { id: string }) => {
      const { data, error } = await supabase
        .from('resistance_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resistance-templates'] });
      toast({
        title: 'Template updated',
        description: 'Changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('resistance_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resistance-templates'] });
      toast({
        title: 'Template deleted',
        description: 'The template has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    templates: templatesQuery.data || [],
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  };
}
