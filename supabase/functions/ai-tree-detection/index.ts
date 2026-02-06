import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { imageUrl, projectId, detectionType = "tree_detection" } = await req.json();

    if (!imageUrl || !projectId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: imageUrl, projectId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create detection record
    const { data: detectionRecord, error: insertError } = await supabase
      .from("ai_detection_results")
      .insert({
        project_id: projectId,
        user_id: userId,
        image_url: imageUrl,
        detection_type: detectionType,
        processing_status: "processing",
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create detection record: ${insertError.message}`);
    }

    // Build the AI prompt based on detection type
    let systemPrompt = "";
    let userPrompt = "";

    if (detectionType === "tree_detection") {
      systemPrompt = `You are an expert in remote sensing and vegetation analysis. Analyze satellite or aerial images to detect trees and vegetation patterns.`;
      userPrompt = `Analyze this image and detect all visible trees. For each tree or tree cluster you can identify, provide:
1. Approximate location as relative coordinates (x, y as percentages from 0-100)
2. Estimated canopy size (small, medium, large)
3. If visible, the likely species or tree type
4. Health assessment if determinable (healthy, stressed, dead)

Return your analysis as a JSON object with this structure:
{
  "totalTrees": number,
  "treeClusters": number,
  "detectedTrees": [
    {
      "id": "tree_1",
      "x": 50,
      "y": 30,
      "canopySize": "medium",
      "species": "Unknown deciduous",
      "health": "healthy",
      "confidence": 0.85
    }
  ],
  "vegetationCoverage": "percentage of image covered by vegetation",
  "analysis": "brief summary of findings"
}`;
    } else if (detectionType === "habitat_classification") {
      systemPrompt = `You are an expert in habitat classification and land use analysis from remote sensing imagery.`;
      userPrompt = `Analyze this image and classify the different habitat types visible. Identify:
1. Forest areas
2. Grasslands
3. Water bodies
4. Urban/developed areas
5. Agricultural land
6. Bare ground

Return your analysis as a JSON object with habitat polygons described by approximate boundary coordinates (as percentages 0-100) and classification:
{
  "habitats": [
    {
      "id": "habitat_1",
      "type": "forest",
      "coverage": 45,
      "boundaryPoints": [[10,10], [50,10], [50,50], [10,50]],
      "quality": "good",
      "notes": "Dense canopy"
    }
  ],
  "dominantHabitat": "forest",
  "fragmentationLevel": "low/medium/high",
  "analysis": "summary"
}`;
    } else {
      systemPrompt = `You are an expert in land use classification from satellite imagery.`;
      userPrompt = `Analyze this image for land use patterns. Identify developed areas, natural areas, and potential wildlife corridors or barriers.

Return as JSON:
{
  "landUseTypes": [{"type": "...", "coverage": percent}],
  "potentialCorridors": [...],
  "barriers": [...],
  "recommendations": [...]
}`;
    }

    // Call AI for analysis
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Update record with failure
      await supabase
        .from("ai_detection_results")
        .update({
          processing_status: "failed",
          error_message: `AI API error: ${aiResponse.status}`,
        })
        .eq("id", detectionRecord.id);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error("Failed to analyze image");
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from AI response
    let detectedFeatures = null;
    let geojsonOutput = null;
    let confidenceScore = 0;

    try {
      // Extract JSON from response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        detectedFeatures = JSON.parse(jsonMatch[0]);
        
        // Convert to GeoJSON if tree detection
        if (detectionType === "tree_detection" && detectedFeatures.detectedTrees) {
          geojsonOutput = {
            type: "FeatureCollection",
            features: detectedFeatures.detectedTrees.map((tree: any, idx: number) => ({
              type: "Feature",
              geometry: {
                type: "Point",
                // These are relative coordinates - actual geo-coords need image georeferencing
                coordinates: [tree.x, tree.y],
              },
              properties: {
                id: tree.id || `tree_${idx + 1}`,
                canopySize: tree.canopySize,
                species: tree.species,
                health: tree.health,
                confidence: tree.confidence,
                source: "ai_detection",
              },
            })),
          };
          
          // Calculate average confidence
          const confidences = detectedFeatures.detectedTrees
            .map((t: any) => t.confidence)
            .filter((c: any) => typeof c === "number");
          if (confidences.length > 0) {
            confidenceScore = confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length;
          }
        }
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      detectedFeatures = { raw: aiContent, parseError: true };
    }

    // Update detection record with results
    const { data: updatedRecord, error: updateError } = await supabase
      .from("ai_detection_results")
      .update({
        detected_features: detectedFeatures,
        geojson_output: geojsonOutput,
        confidence_score: confidenceScore,
        processing_status: "completed",
      })
      .eq("id", detectionRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update detection record:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        detectionId: detectionRecord.id,
        detectedFeatures,
        geojsonOutput,
        confidenceScore,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI detection error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
