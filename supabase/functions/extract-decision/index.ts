import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Decision Extractor for an Institutional Memory OS.

Given an unstructured workplace conversation thread (Slack, email, PR discussion, meeting notes), extract the underlying decision structure with rigor. Use the extract_decision tool.

For each thread, you must return:
- decision: the concrete decision (one sentence, present tense, action-oriented)
- reason: WHY this decision was made (the core argument that won)
- alternatives: options that were considered but rejected (each as a short phrase)
- constraints: limitations or pressures that shaped the decision
- tradeoffs: what is being given up by choosing this option (each is a short phrase)
- expected_outcome: what the team expects/hopes will happen
- owner: the person who made the call (extract from @handle, name, or role; null if unclear)
- contributors: other people who participated meaningfully in the discussion
- revisit_trigger: a future condition that should trigger revisiting this decision (e.g. "after SOC2 audit", "if connection pool maxes out again", "Q3 planning"). null if none.
- relations: causal edges to other concepts. types: 'led_to' | 'contradicts' | 'informed_by' | 'outcome_was'
- confidence: 0-1, how clearly the decision is expressed
- clarity_score: 0-1, how unambiguous the decision is
- consensus_score: 0-1, how aligned the participants are
- risk_score: 0-1, downside risk of the choice
- reversibility_score: 0-1, ease of reversing (1 = trivially reversible, 0 = one-way door)
- risk_level: "low" | "medium" | "high" — derived from risk + reversibility

Be precise. If the thread is ambiguous or contains no decision, return decision="No clear decision detected" and confidence near 0.`;

const tool = {
  type: "function",
  function: {
    name: "extract_decision",
    description: "Extract a structured decision from an unstructured conversation thread.",
    parameters: {
      type: "object",
      properties: {
        decision: { type: "string" },
        reason: { type: "string" },
        alternatives: { type: "array", items: { type: "string" } },
        constraints: { type: "array", items: { type: "string" } },
        tradeoffs: { type: "array", items: { type: "string" } },
        expected_outcome: { type: "string" },
        owner: { type: "string" },
        contributors: { type: "array", items: { type: "string" } },
        revisit_trigger: { type: "string" },
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["led_to", "contradicts", "informed_by", "outcome_was"] },
              target: { type: "string" },
            },
            required: ["type", "target"],
            additionalProperties: false,
          },
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        clarity_score: { type: "number", minimum: 0, maximum: 1 },
        consensus_score: { type: "number", minimum: 0, maximum: 1 },
        risk_score: { type: "number", minimum: 0, maximum: 1 },
        reversibility_score: { type: "number", minimum: 0, maximum: 1 },
        risk_level: { type: "string", enum: ["low", "medium", "high"] },
      },
      required: [
        "decision",
        "reason",
        "alternatives",
        "constraints",
        "tradeoffs",
        "expected_outcome",
        "contributors",
        "relations",
        "confidence",
        "clarity_score",
        "consensus_score",
        "risk_score",
        "reversibility_score",
        "risk_level",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { thread } = await req.json();
    if (!thread || typeof thread !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'thread' string in body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const IMOS_AI_API_KEY = Deno.env.get("IMOS_AI_API_KEY");
    if (!IMOS_AI_API_KEY) {
      return new Response(JSON.stringify({ error: "IMOS_AI_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${IMOS_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: thread },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_decision" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted. Add credits at Settings → Workspace → Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("IMOS AI error", aiRes.status, text);
      return new Response(JSON.stringify({ error: "Upstream AI error." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "Model did not return structured output." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(args);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-decision error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
