import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Species {
  id: string;
  scientific_name: string;
  common_name: string | null;
  local_names: Record<string, string> | null;
  family: string | null;
  vulnerability_index: number | null;
  growth_rate: string | null;
  max_height_m: number | null;
  max_dbh_cm: number | null;
  lifespan_years: number | null;
  carbon_sequestration_rate: number | null;
  oxygen_production_rate: number | null;
  ecological_value_notes: string | null;
  photo_url: string | null;
  created_at: string;
}

export function useSpeciesDatabase() {
  const { user } = useAuth();

  const speciesQuery = useQuery({
    queryKey: ['species-database'],
    queryFn: async (): Promise<Species[]> => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('species_database')
        .select('*')
        .order('common_name', { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        local_names: d.local_names as Record<string, string> | null,
      }));
    },
    enabled: !!user,
  });

  const getSpeciesByName = (name: string): Species | undefined => {
    return speciesQuery.data?.find(
      s => s.common_name?.toLowerCase() === name.toLowerCase() ||
           s.scientific_name.toLowerCase() === name.toLowerCase()
    );
  };

  const getVulnerabilityIndex = (speciesName: string): number => {
    const species = getSpeciesByName(speciesName);
    return species?.vulnerability_index || 5; // Default to medium vulnerability
  };

  const getCarbonValue = (speciesName: string, ageYears: number): number => {
    const species = getSpeciesByName(speciesName);
    const rate = species?.carbon_sequestration_rate || 20;
    return rate * ageYears;
  };

  const getOxygenValue = (speciesName: string, years: number = 10): number => {
    const species = getSpeciesByName(speciesName);
    const rate = species?.oxygen_production_rate || 80;
    return rate * years;
  };

  return {
    species: speciesQuery.data || [],
    isLoading: speciesQuery.isLoading,
    error: speciesQuery.error,
    getSpeciesByName,
    getVulnerabilityIndex,
    getCarbonValue,
    getOxygenValue,
  };
}
