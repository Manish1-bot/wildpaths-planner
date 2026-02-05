 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 interface FormResponse {
   // Common fields
   timestamp: string;
   email?: string;
   
   // Location fields
   latitude: number | string;
   longitude: number | string;
   
   // Tree-specific fields
   species?: string;
   height?: number | string;
   age?: number | string;
   health?: string;
   trunk_diameter?: number | string;
   canopy_diameter?: number | string;
   notes?: string;
   tree_id?: string;
   
   // Corridor-specific fields
   observation_type?: string;
   title?: string;
   description?: string;
   habitat_type?: string;
   risk_level?: string;
   species_observed?: string;
   infrastructure_type?: string;
 }
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
     const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
     const supabase = createClient(supabaseUrl, supabaseKey);
 
     const body = await req.json();
     const { formType, projectId, userId, responses } = body;
 
     if (!formType || !projectId || !responses) {
       return new Response(
         JSON.stringify({ error: "Missing required fields: formType, projectId, responses" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Log the import attempt
     const { data: importLog, error: logError } = await supabase
       .from("google_form_imports")
       .insert({
         project_id: projectId,
         user_id: userId,
         form_type: formType,
         import_source: "webhook",
         raw_data: responses,
         status: "processing",
       })
       .select()
       .single();
 
     if (logError) {
       console.error("Failed to log import:", logError);
     }
 
     const results = {
       processed: 0,
       failed: 0,
       errors: [] as string[],
     };
 
     if (formType === "tree_observation") {
       // Process tree observations
       for (const response of responses as FormResponse[]) {
         try {
           const lat = parseFloat(String(response.latitude));
           const lng = parseFloat(String(response.longitude));
           
           if (isNaN(lat) || isNaN(lng)) {
             results.failed++;
             results.errors.push(`Invalid coordinates for entry`);
             continue;
           }
 
           const { error } = await supabase.from("tree_observations").insert({
             project_id: projectId,
             user_id: userId,
             latitude: lat,
             longitude: lng,
             species: response.species || null,
             height_meters: response.height ? parseFloat(String(response.height)) : null,
             age_years: response.age ? parseInt(String(response.age)) : null,
             health_status: response.health || null,
             trunk_diameter_cm: response.trunk_diameter ? parseFloat(String(response.trunk_diameter)) : null,
             canopy_diameter_meters: response.canopy_diameter ? parseFloat(String(response.canopy_diameter)) : null,
             notes: response.notes || null,
             tree_id: response.tree_id || null,
             observation_date: response.timestamp || new Date().toISOString(),
             metadata: { imported_from: "google_form", original_data: response },
           });
 
           if (error) {
             results.failed++;
             results.errors.push(error.message);
           } else {
             results.processed++;
           }
         } catch (e) {
           results.failed++;
           results.errors.push(e instanceof Error ? e.message : "Unknown error");
         }
       }
     } else if (formType === "field_observation") {
       // Process corridor/field observations
       for (const response of responses as FormResponse[]) {
         try {
           const lat = parseFloat(String(response.latitude));
           const lng = parseFloat(String(response.longitude));
           
           if (isNaN(lat) || isNaN(lng)) {
             results.failed++;
             results.errors.push(`Invalid coordinates for entry`);
             continue;
           }
 
           const obsType = response.observation_type || "wildlife_sighting";
           const speciesArray = response.species_observed 
             ? response.species_observed.split(",").map(s => s.trim())
             : null;
 
           const { error } = await supabase.from("field_observations").insert({
             project_id: projectId,
             user_id: userId,
             latitude: lat,
             longitude: lng,
             observation_type: obsType,
             title: response.title || `Observation at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
             description: response.description || null,
             habitat_type: response.habitat_type || null,
             risk_level: response.risk_level || null,
             species_observed: speciesArray,
             infrastructure_type: response.infrastructure_type || null,
             metadata: { imported_from: "google_form", original_data: response },
           });
 
           if (error) {
             results.failed++;
             results.errors.push(error.message);
           } else {
             results.processed++;
           }
         } catch (e) {
           results.failed++;
           results.errors.push(e instanceof Error ? e.message : "Unknown error");
         }
       }
     } else {
       return new Response(
         JSON.stringify({ error: "Invalid formType. Use 'tree_observation' or 'field_observation'" }),
         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     // Update import log
     if (importLog) {
       await supabase
         .from("google_form_imports")
         .update({
           status: results.failed > 0 ? "partial" : "completed",
           processed_count: results.processed,
           failed_count: results.failed,
           error_log: results.errors.length > 0 ? results.errors : null,
         })
         .eq("id", importLog.id);
     }
 
     return new Response(
       JSON.stringify({
         success: true,
         processed: results.processed,
         failed: results.failed,
         errors: results.errors.slice(0, 10), // Limit error messages
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   } catch (error) {
     console.error("Webhook error:", error);
     return new Response(
       JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
   }
 });