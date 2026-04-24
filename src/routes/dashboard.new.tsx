import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/new")({
  component: NewDecisionPage,
  head: () => ({ meta: [{ title: "Capture decision — imos" }] }),
});

const SAMPLE = `@alice 10:14 — We keep getting paged on the auth service. Postgres connections maxing out under load.
@bob 10:16 — We talked about pgbouncer last quarter but punted because it'd add infra.
@alice 10:17 — Yeah, but Cloud SQL has built-in connection pooling now. We could just flip it on.
@carol 10:21 — What about moving to a managed connection pooler like Supabase pooler? Less lock-in.
@bob 10:24 — Cloud SQL pooler is one config flag. Supabase is a migration. We have a SOC2 audit in 6 weeks — not the time.
@alice 10:26 — Agreed. Let's enable Cloud SQL connection pooling this week. Revisit Supabase pooler post-audit if we still see issues.`;

type Extracted = {
  decision: string;
  reason?: string;
  alternatives: string[];
  constraints: string[];
  tradeoffs: string[];
  expected_outcome: string;
  owner?: string;
  contributors: string[];
  revisit_trigger?: string;
  relations: { type: string; target: string }[];
  confidence: number;
  clarity_score: number;
  consensus_score: number;
  risk_score: number;
  reversibility_score: number;
  risk_level: "low" | "medium" | "high";
};

type Conflict = {
  past_id: string;
  past_decision: string;
  type: "contradicts" | "overrides" | "duplicates";
  explanation: string;
};

function NewDecisionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState(SAMPLE);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Slack");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Extracted | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const extract = async () => {
    setExtracting(true);
    setResult(null);
    setConflicts([]);
    try {
      const { data, error } = await supabase.functions.invoke("extract-decision", {
        body: { thread },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const extracted = data as Extracted;
      setResult(extracted);

      // Conflict detection vs past decisions
      const { data: past } = await supabase
        .from("decision_threads")
        .select("id, decision, constraints, tradeoffs")
        .order("created_at", { ascending: false })
        .limit(20);
      if (past && past.length > 0) {
        const { data: cdata } = await supabase.functions.invoke("detect-conflicts", {
          body: {
            newDecision: {
              decision: extracted.decision,
              constraints: extracted.constraints,
              tradeoffs: extracted.tradeoffs,
            },
            pastDecisions: past,
          },
        });
        if (cdata?.conflicts) setConflicts(cdata.conflicts as Conflict[]);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    if (!result || !user) return;
    setSaving(true);
    const revisitAt = parseRevisit(result.revisit_trigger);
    const { data, error } = await supabase
      .from("decision_threads")
      .insert({
        user_id: user.id,
        title: title.trim() || null,
        source: source.trim() || null,
        raw_thread: thread,
        decision: result.decision,
        reason: result.reason || null,
        alternatives: result.alternatives,
        constraints: result.constraints,
        tradeoffs: result.tradeoffs,
        expected_outcome: result.expected_outcome,
        owner: result.owner || null,
        contributors: result.contributors,
        revisit_trigger: result.revisit_trigger || null,
        revisit_at: revisitAt,
        relations: result.relations,
        confidence: result.confidence,
        clarity_score: result.clarity_score,
        consensus_score: result.consensus_score,
        risk_score: result.risk_score,
        reversibility_score: result.reversibility_score,
        risk_level: result.risk_level,
        conflicts: conflicts,
      })
      .select("id")
      .single();
    if (error || !data) {
      setSaving(false);
      toast.error(error?.message ?? "Save failed");
      return;
    }

    // Seed timeline events
    const events = [
      { kind: "problem", label: "Problem surfaced in thread", detail: null },
      { kind: "discussion", label: "Discussion among contributors", detail: result.contributors.join(", ") || null },
      { kind: "decided", label: "Decision made", detail: result.decision },
    ];
    await supabase.from("decision_events").insert(
      events.map((e) => ({
        thread_id: data.id,
        user_id: user.id,
        kind: e.kind,
        label: e.label,
        detail: e.detail,
      })),
    );

    setSaving(false);
    toast.success("Saved to your graph");
    navigate({ to: "/dashboard/$id", params: { id: data.id } });
  };

  return (
    <Shell variant="app">
      <div className="mb-6">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          ← Back to dashboard
        </button>
        <SectionLabel>Capture a decision</SectionLabel>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Paste a conversation. The extraction engine pulls the decision, reason, alternatives,
          trade-offs, owner, revisit trigger, and quality scores — and flags conflicts with past
          decisions before you save.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BlueprintCard>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            Input · Conversation thread
          </h3>

          <div className="mb-3 grid grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Title (optional)
              </div>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Auth pooler rollout"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              />
            </label>
            <label className="block">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Source
              </div>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
              >
                <option>Slack</option>
                <option>GitHub PR</option>
                <option>Email</option>
                <option>Meeting</option>
                <option>Jira</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <textarea
            value={thread}
            onChange={(e) => setThread(e.target.value)}
            rows={16}
            className="w-full resize-y rounded-md border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-primary/50"
            placeholder="Paste a Slack thread, PR comments, or meeting transcript…"
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={extract}
              disabled={extracting || !thread.trim()}
              className="rounded-md border border-primary/40 bg-primary/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary hover:bg-primary/20 disabled:opacity-50"
            >
              {extracting ? "Extracting…" : "Extract with AI →"}
            </button>
            <button
              onClick={() => setThread(SAMPLE)}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Reset sample
            </button>
          </div>
        </BlueprintCard>

        <BlueprintCard>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            Output · Structured decision
          </h3>

          {!result && !extracting && (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Awaiting extraction…
              </p>
            </div>
          )}
          {extracting && (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Reasoning over thread, scoring, checking conflicts…
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Field label="Decision">
                <p className="text-base leading-relaxed text-foreground">{result.decision}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Tag color={result.risk_level === "low" ? "green" : result.risk_level === "medium" ? "amber" : "red"}>
                    {result.risk_level} risk
                  </Tag>
                  <Tag color={result.consensus_score > 0.7 ? "green" : result.consensus_score > 0.4 ? "amber" : "red"}>
                    consensus {(result.consensus_score * 100).toFixed(0)}%
                  </Tag>
                  <Tag color={result.reversibility_score > 0.6 ? "green" : "amber"}>
                    {result.reversibility_score > 0.6 ? "reversible" : "one-way door"}
                  </Tag>
                </div>
              </Field>

              {result.reason && (
                <Field label="Why">
                  <p className="text-sm leading-relaxed text-muted-foreground">{result.reason}</p>
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                {result.owner && (
                  <Field label="Owner">
                    <p className="text-sm text-foreground">{result.owner}</p>
                  </Field>
                )}
                {result.contributors.length > 0 && (
                  <Field label="Contributors">
                    <p className="text-sm text-foreground">{result.contributors.join(", ")}</p>
                  </Field>
                )}
              </div>

              {result.revisit_trigger && (
                <Field label="Revisit when">
                  <p className="rounded-md border border-amber-500/20 bg-tag-amber/40 px-3 py-2 text-sm text-foreground">
                    🔔 {result.revisit_trigger}
                  </p>
                </Field>
              )}

              <Field label="Trade-offs">
                <List items={result.tradeoffs} />
              </Field>
              <Field label="Alternatives rejected">
                <List items={result.alternatives} />
              </Field>
              <Field label="Constraints">
                <List items={result.constraints} />
              </Field>

              {conflicts.length > 0 && (
                <Field label={`⚠ Conflicts with ${conflicts.length} past decision${conflicts.length > 1 ? "s" : ""}`}>
                  <ul className="space-y-2">
                    {conflicts.map((c, i) => (
                      <li key={i} className="rounded border border-tag-red-foreground/30 bg-tag-red/30 p-2.5">
                        <Tag color="red">{c.type}</Tag>
                        <p className="mt-1.5 text-sm text-foreground">{c.past_decision}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{c.explanation}</p>
                      </li>
                    ))}
                  </ul>
                </Field>
              )}

              <button
                onClick={save}
                disabled={saving}
                className="mt-2 w-full rounded-md bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save to graph →"}
              </button>
            </div>
          )}
        </BlueprintCard>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0)
    return <p className="text-sm text-muted-foreground">None recorded.</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((a, i) => (
        <li
          key={i}
          className="rounded border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground"
        >
          {a}
        </li>
      ))}
    </ul>
  );
}

// Best-effort parse of revisit trigger into a date if the phrase contains a duration.
function parseRevisit(trigger?: string): string | null {
  if (!trigger) return null;
  const m = trigger.match(/(\d+)\s*(day|week|month|quarter|year)s?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const days =
    unit === "day" ? n : unit === "week" ? n * 7 : unit === "month" ? n * 30 : unit === "quarter" ? n * 90 : n * 365;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
