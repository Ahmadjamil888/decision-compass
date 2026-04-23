import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are the Decision Extractor for an Institutional Memory OS.

Given an unstructured workplace conversation thread (Slack, email, PR discussion, meeting notes), extract the underlying decision structure. Use the extract_decision tool to return:
- decision: the concrete decision that was made (one sentence)
- alternatives: options that were considered but not chosen
- constraints: limitations, requirements, or pressures that shaped the decision
- expected_outcome: what the team expects/hopes will happen as a result
- relations: causal edges to other concepts (use 'led_to', 'contradicts', 'informed_by', 'outcome_was')
- confidence: 0-1 score for how clearly the decision is expressed

Be concise. If the thread is ambiguous or contains no decision, return decision="No clear decision detected" and confidence near 0.`;

const tool = {
  type: "function",
  function: {
    name: "extract_decision",
    description: "Extract a structured decision from an unstructured conversation thread.",
    parameters: {
      type: "object",
      properties: {
        decision: { type: "string", description: "The concrete decision made (one sentence)." },
        alternatives: {
          type: "array",
          items: { type: "string" },
          description: "Options that were considered but not chosen.",
        },
        constraints: {
          type: "array",
          items: { type: "string" },
          description: "Limitations or pressures that shaped the decision.",
        },
        expected_outcome: {
          type: "string",
          description: "What the team expects to happen as a result.",
        },
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["led_to", "contradicts", "informed_by", "outcome_was"],
              },
              target: { type: "string" },
            },
            required: ["type", "target"],
            additionalProperties: false,
          },
        },
        confidence: { type: "number", minimum: 0, maximum: 1 },
      },
      required: [
        "decision",
        "alternatives",
        "constraints",
        "expected_outcome",
        "relations",
        "confidence",
      ],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { thread } = await req.json();
    if (!thread || typeof thread !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'thread' string in body." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: thread },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "extract_decision" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({
          error:
            "Lovable AI credits exhausted. Add credits at Settings → Workspace → Usage.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("Lovable AI error", aiRes.status, text);
      return new Response(JSON.stringify({ error: "Upstream AI error." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    const args = call?.function?.arguments;
    if (!args) {
      return new Response(
        JSON.stringify({ error: "Model did not return a structured decision." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const parsed = JSON.parse(args);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-decision error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
