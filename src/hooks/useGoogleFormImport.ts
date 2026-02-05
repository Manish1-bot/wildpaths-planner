 import { useState } from 'react';
 import { supabase } from '@/integrations/supabase/client';
 import { useAuth } from '@/contexts/AuthContext';
 import { useToast } from '@/hooks/use-toast';
 import { useQueryClient } from '@tanstack/react-query';
 
 interface CSVRow {
   [key: string]: string;
 }
 
 interface ImportResult {
   processed: number;
   failed: number;
   errors: string[];
 }
 
 export function useGoogleFormImport(projectId: string | undefined) {
   const { user } = useAuth();
   const { toast } = useToast();
   const queryClient = useQueryClient();
   const [isImporting, setIsImporting] = useState(false);
 
   const parseCSV = (csvText: string): CSVRow[] => {
     const lines = csvText.split('\n').filter(line => line.trim());
     if (lines.length < 2) return [];
 
     const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
     const rows: CSVRow[] = [];
 
     for (let i = 1; i < lines.length; i++) {
       const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
       const row: CSVRow = {};
       
       headers.forEach((header, index) => {
         row[header] = values[index]?.replace(/"/g, '').trim() || '';
       });
       
       rows.push(row);
     }
 
     return rows;
   };
 
   const normalizeFieldName = (fieldName: string): string => {
     const normalized = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
     
     // Map common variations
     const mappings: Record<string, string> = {
       'lat': 'latitude',
       'lng': 'longitude',
       'long': 'longitude',
       'lon': 'longitude',
       'tree_species': 'species',
       'tree_height': 'height',
       'height_m': 'height',
       'age_years': 'age',
       'tree_age': 'age',
       'health_status': 'health',
       'tree_health': 'health',
       'trunk_dbh': 'trunk_diameter',
       'dbh': 'trunk_diameter',
       'trunk_diameter_cm': 'trunk_diameter',
       'canopy_width': 'canopy_diameter',
       'canopy_size': 'canopy_diameter',
       'observation_notes': 'notes',
       'comments': 'notes',
       'type': 'observation_type',
       'obs_type': 'observation_type',
       'name': 'title',
       'observation_title': 'title',
       'habitat': 'habitat_type',
       'risk': 'risk_level',
       'species_seen': 'species_observed',
       'wildlife_species': 'species_observed',
       'infrastructure': 'infrastructure_type',
     };
 
     return mappings[normalized] || normalized;
   };
 
   const importTreeCSV = async (file: File): Promise<ImportResult> => {
     if (!user || !projectId) {
       throw new Error('Not authenticated or no project selected');
     }
 
     setIsImporting(true);
     
     try {
       const text = await file.text();
       const rows = parseCSV(text);
       
       if (rows.length === 0) {
         throw new Error('No data found in CSV');
       }
 
       // Normalize field names
       const normalizedRows = rows.map(row => {
         const normalized: Record<string, string> = {};
         Object.entries(row).forEach(([key, value]) => {
           normalized[normalizeFieldName(key)] = value;
         });
         return normalized;
       });
 
       // Call the webhook function
       const { data, error } = await supabase.functions.invoke('google-form-webhook', {
         body: {
           formType: 'tree_observation',
           projectId,
           userId: user.id,
           responses: normalizedRows,
         },
       });
 
       if (error) throw error;
 
       // Invalidate queries to refresh data
       queryClient.invalidateQueries({ queryKey: ['tree-observations', projectId] });
 
       toast({
         title: 'Import Complete',
         description: `Successfully imported ${data.processed} trees. ${data.failed} failed.`,
       });
 
       return data;
     } finally {
       setIsImporting(false);
     }
   };
 
   const importObservationCSV = async (file: File): Promise<ImportResult> => {
     if (!user || !projectId) {
       throw new Error('Not authenticated or no project selected');
     }
 
     setIsImporting(true);
     
     try {
       const text = await file.text();
       const rows = parseCSV(text);
       
       if (rows.length === 0) {
         throw new Error('No data found in CSV');
       }
 
       // Normalize field names
       const normalizedRows = rows.map(row => {
         const normalized: Record<string, string> = {};
         Object.entries(row).forEach(([key, value]) => {
           normalized[normalizeFieldName(key)] = value;
         });
         return normalized;
       });
 
       // Call the webhook function
       const { data, error } = await supabase.functions.invoke('google-form-webhook', {
         body: {
           formType: 'field_observation',
           projectId,
           userId: user.id,
           responses: normalizedRows,
         },
       });
 
       if (error) throw error;
 
       // Invalidate queries to refresh data
       queryClient.invalidateQueries({ queryKey: ['field-observations', projectId] });
 
       toast({
         title: 'Import Complete',
         description: `Successfully imported ${data.processed} observations. ${data.failed} failed.`,
       });
 
       return data;
     } finally {
       setIsImporting(false);
     }
   };
 
   return {
     importTreeCSV,
     importObservationCSV,
     isImporting,
   };
 }