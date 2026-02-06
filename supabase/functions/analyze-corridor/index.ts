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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { corridorData, observationsData, analysisType = "corridor_optimization" } = await req.json();

    if (!corridorData) {
      return new Response(
        JSON.stringify({ error: "Missing corridor data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "corridor_optimization") {
      systemPrompt = `You are an expert wildlife corridor planner and conservation biologist. Analyze corridor proposals and field observations to provide scientific recommendations for wildlife movement and habitat connectivity.`;
      
      userPrompt = `Analyze this wildlife corridor data and provide optimization recommendations:

CORRIDOR DATA:
${JSON.stringify(corridorData, null, 2)}

${observationsData ? `FIELD OBSERVATIONS:
${JSON.stringify(observationsData, null, 2)}` : ""}

Provide a comprehensive analysis including:
1. Connectivity Assessment - how well does this corridor connect habitat patches?
2. Risk Analysis - identify potential barriers and conflict zones
3. Species Suitability - which species would benefit from this corridor?
4. Optimization Suggestions - specific changes to improve the corridor
5. Priority Actions - ranked list of recommended modifications

Return your analysis as JSON:
{
  "connectivityScore": 0-100,
  "overallRisk": "low/medium/high",
  "riskZones": [{"location": "description", "risk": "level", "mitigation": "suggestion"}],
  "speciesSuitability": [{"species": "name", "suitability": "score", "notes": "details"}],
  "optimizations": [{"priority": 1-5, "action": "description", "impact": "expected benefit"}],
  "summary": "executive summary",
  "recommendations": ["actionable recommendation 1", "..."]
}`;
    } else if (analysisType === "conflict_detection") {
      systemPrompt = `You are an expert in human-wildlife conflict analysis and infrastructure impact assessment.`;
      
      userPrompt = `Analyze this corridor for potential conflicts and barriers:

CORRIDOR DATA:
${JSON.stringify(corridorData, null, 2)}

${observationsData ? `OBSERVATIONS:
${JSON.stringify(observationsData, null, 2)}` : ""}

Identify:
1. Road crossings and traffic risks
2. Human settlement proximity
3. Agricultural land conflicts
4. Infrastructure barriers
5. Seasonal migration concerns

Return as JSON:
{
  "conflictPoints": [{"type": "road/settlement/agriculture", "severity": "level", "coordinates": [], "mitigation": "..."}],
  "barrierAnalysis": [...],
  "seasonalRisks": [...],
  "mitigationPriorities": [...]
}`;
    } else {
      // Dynamic corridor generation
      systemPrompt = `You are an expert in computational corridor design using landscape connectivity principles.`;
      
      userPrompt = `Based on these field observations and habitat data, suggest optimal corridor routes:

DATA:
${JSON.stringify(observationsData || corridorData, null, 2)}

Generate corridor suggestions that:
1. Connect wildlife observation points
2. Avoid high-risk zones
3. Utilize existing vegetation cover
4. Minimize human conflict potential

Return as JSON:
{
  "suggestedCorridors": [
    {
      "id": "corridor_1",
      "name": "descriptive name",
      "priority": "high/medium/low",
      "pathPoints": [[lng, lat], ...],
      "width": "meters",
      "justification": "why this route",
      "challenges": ["potential issues"],
      "recommendations": ["specific actions"]
    }
  ],
  "connectivityAnalysis": "overall assessment",
  "priorityAreas": ["areas needing attention"]
}`;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let analysis = null;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      analysis = { raw: content, parseError: true };
    }

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Corridor analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
