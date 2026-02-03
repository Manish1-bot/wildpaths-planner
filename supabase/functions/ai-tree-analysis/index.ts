import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { treeData, developmentData, analysisType = "impact_assessment" } = await req.json();

    if (!treeData) {
      return new Response(
        JSON.stringify({ error: "Missing tree data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "impact_assessment") {
      systemPrompt = `You are an expert arborist and environmental impact assessor. Analyze tree data and development plans to provide detailed impact assessments with scientific recommendations.`;
      
      userPrompt = `Analyze this tree impact data and provide a comprehensive assessment:

TREE DATA:
${JSON.stringify(treeData, null, 2)}

${developmentData ? `DEVELOPMENT DATA:
${JSON.stringify(developmentData, null, 2)}` : ""}

Provide:
1. Overall Impact Assessment
2. Species-wise vulnerability analysis
3. Health-based survival predictions
4. Mitigation recommendations
5. Replanting strategy

Return as JSON:
{
  "overallImpact": "low/moderate/high/severe",
  "impactScore": 0-100,
  "speciesAnalysis": [
    {"species": "name", "count": n, "vulnerabilityScore": 0-100, "survivalPrediction": "%", "recommendation": "..."}
  ],
  "healthAnalysis": [
    {"category": "excellent/good/fair/poor", "count": n, "survivalRate": "%", "priority": "high/medium/low"}
  ],
  "vulnerableTrees": [
    {"id": "...", "reason": "proximity to development/health issues/species sensitivity", "riskLevel": "...", "recommendation": "transplant/protect/monitor"}
  ],
  "mitigations": [
    {"priority": 1-5, "action": "description", "affectedTrees": n, "cost": "low/medium/high", "effectiveness": "%"}
  ],
  "replantingPlan": {
    "minimumRatio": "2:1",
    "recommendedSpecies": ["native species 1", "..."],
    "locations": "guidance on replanting locations",
    "timeline": "suggested timeline"
  },
  "summary": "executive summary",
  "futurePredictions": [
    {"timeframe": "2 years", "prediction": "..."},
    {"timeframe": "5 years", "prediction": "..."}
  ]
}`;
    } else if (analysisType === "health_prediction") {
      systemPrompt = `You are an expert in tree health assessment and predictive modeling for urban and forest trees.`;
      
      userPrompt = `Analyze the health patterns in this tree data and predict future outcomes:

TREE DATA:
${JSON.stringify(treeData, null, 2)}

Provide health predictions including:
1. Which trees are likely to decline
2. Disease/stress risk patterns
3. Survival probability by species and condition
4. Intervention recommendations

Return as JSON:
{
  "healthTrends": [...],
  "atRiskTrees": [...],
  "interventions": [...],
  "predictions": [...]
}`;
    } else {
      // Filtering recommendations
      systemPrompt = `You are an expert in environmental data analysis and conservation prioritization.`;
      
      userPrompt = `Based on this tree data, suggest filtering and prioritization strategies:

DATA:
${JSON.stringify(treeData, null, 2)}

Identify priority trees for:
1. Conservation (high ecological value)
2. Monitoring (at-risk)
3. Transplantation (can be moved)
4. Documentation (regulatory requirements)

Return as JSON with tree IDs and justifications.`;
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
    console.error("Tree analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
