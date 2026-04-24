import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Decision Conflict Detector. Given a NEW decision and a list of PAST decisions (with their constraints and trade-offs), identify any past decisions that the new one CONTRADICTS, OVERRIDES, or DUPLICATES.

Use the report_conflicts tool. For each conflict include:
- past_id: the id of the past decision
- past_decision: short text of the past decision
- type: "contradicts" | "overrides" | "duplicates"
- explanation: one sentence explaining the conflict

Only report a conflict if you are reasonably confident — do not pad the list. Empty array is a perfectly valid answer.`;

const tool = {
  type: "function",
  function: {
    name: "report_conflicts",
    description: "Report any conflicts between the new decision and past ones.",
    parameters: {
      type: "object",
      properties: {
        conflicts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              past_id: { type: "string" },
              past_decision: { type: "string" },
              type: { type: "string", enum: ["contradicts", "overrides", "duplicates"] },
              explanation: { type: "string" },
            },
            required: ["past_id", "past_decision", "type", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["conflicts"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { newDecision, pastDecisions } = await req.json();
    if (!newDecision) {
      return new Response(JSON.stringify({ error: "Missing 'newDecision'." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(pastDecisions) || pastDecisions.length === 0) {
      return new Response(JSON.stringify({ conflicts: [] }), {
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

    const userMsg = `NEW DECISION:\n${JSON.stringify(newDecision, null, 2)}\n\nPAST DECISIONS:\n${JSON.stringify(pastDecisions, null, 2)}`;

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
          { role: "user", content: userMsg },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "report_conflicts" } },
      }),
    });

    if (aiRes.status === 429 || aiRes.status === 402 || !aiRes.ok) {
      // Fail soft — conflict detection should never block saving.
      return new Response(JSON.stringify({ conflicts: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = args ? JSON.parse(args) : { conflicts: [] };

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("detect-conflicts error", e);
    return new Response(JSON.stringify({ conflicts: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
