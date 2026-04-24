import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag, Reveal } from "@/components/Shell";
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
      <Reveal className="mb-8">
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          className="group mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">←</span> Back to dashboard
        </button>
        <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">Capture node<span className="text-primary">.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground/80">
          Paste a raw conversation. Our engine extracts the intent, scores the quality,
          and cross-references your institutional memory for potential conflicts.
        </p>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={100}>
          <BlueprintCard>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                Input · Context
              </h3>
              <button
                onClick={() => setThread(SAMPLE)}
                className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                Use sample
              </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Auth pooler rollout"
                  className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3 font-mono text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:bg-card/60"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3 font-mono text-sm text-foreground outline-none transition-all focus:border-primary/40 focus:bg-card/60"
                >
                  <option>Slack</option>
                  <option>GitHub PR</option>
                  <option>Email</option>
                  <option>Meeting</option>
                  <option>Jira</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">Conversation Thread</label>
              <textarea
                value={thread}
                onChange={(e) => setThread(e.target.value)}
                rows={14}
                className="w-full resize-none rounded-xl border border-border/60 bg-card/40 p-4 font-mono text-xs leading-relaxed text-foreground outline-none transition-all focus:border-primary/40 focus:bg-card/60"
                placeholder="Paste Slack, PR comments, or transcripts…"
              />
            </div>

            <button
              onClick={extract}
              disabled={extracting || !thread.trim()}
              className="group relative mt-6 w-full overflow-hidden rounded-full bg-primary/10 px-6 py-4 font-mono text-[11px] uppercase tracking-wider text-primary transition-all duration-300 hover:bg-primary/20 disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {extracting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
                    Extracting intent…
                  </>
                ) : (
                  <>
                    Begin AI Extraction <span className="transition-transform group-hover:translate-x-1">→</span>
                  </>
                )}
              </span>
            </button>
          </BlueprintCard>
        </Reveal>

        <Reveal delay={200}>
          <BlueprintCard className="h-full">
            <h3 className="mb-6 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              Output · Extraction
            </h3>

            {!result && !extracting && (
              <div className="flex h-[400px] flex-col items-center justify-center text-center">
                <div className="mb-4 h-px w-12 bg-border/60" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
                  Ready for analysis
                </p>
              </div>
            )}

            {extracting && (
              <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  Mapping relationships & identifying risk
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <Field label="Decision Intent">
                  <p className="text-base leading-relaxed text-foreground">{result.decision}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Tag color={result.risk_level === "low" ? "green" : result.risk_level === "medium" ? "amber" : "red"}>
                      {result.risk_level} risk
                    </Tag>
                    <Tag color={result.consensus_score > 0.7 ? "green" : result.consensus_score > 0.4 ? "amber" : "red"}>
                      {(result.consensus_score * 100).toFixed(0)}% consensus
                    </Tag>
                    <Tag color={result.reversibility_score > 0.6 ? "green" : "amber"}>
                      {result.reversibility_score > 0.6 ? "reversible" : "one-way door"}
                    </Tag>
                  </div>
                </Field>

                {result.reason && (
                  <Field label="Rationale">
                    <p className="text-sm leading-relaxed text-muted-foreground/80">{result.reason}</p>
                  </Field>
                )}

                <div className="grid grid-cols-2 gap-6">
                  {result.owner && (
                    <Field label="Owner">
                      <p className="text-sm text-foreground/90">{result.owner}</p>
                    </Field>
                  )}
                  {result.contributors.length > 0 && (
                    <Field label="Contributors">
                      <p className="text-sm text-foreground/90">{result.contributors.join(", ")}</p>
                    </Field>
                  )}
                </div>

                {result.revisit_trigger && (
                  <Field label="Revisit Trigger">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-foreground/90">
                      🔔 {result.revisit_trigger}
                    </div>
                  </Field>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Trade-offs">
                    <List items={result.tradeoffs} />
                  </Field>
                  <Field label="Alternatives">
                    <List items={result.alternatives} />
                  </Field>
                </div>

                {conflicts.length > 0 && (
                  <Field label="Institutional Memory Conflict">
                    <ul className="space-y-3">
                      {conflicts.map((c, i) => (
                        <li key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                          <div className="mb-2">
                            <Tag color="red">{c.type}</Tag>
                          </div>
                          <p className="text-sm font-medium text-foreground">{c.past_decision}</p>
                          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/70">{c.explanation}</p>
                        </li>
                      ))}
                    </ul>
                  </Field>
                )}

                <button
                  onClick={save}
                  disabled={saving}
                  className="group relative w-full overflow-hidden rounded-full bg-primary px-6 py-4 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:bg-primary/90 active:scale-[0.98] hover:shadow-xl hover:shadow-primary/10"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {saving ? "Indexing Node…" : "Commit to Graph →"}
                  </span>
                </button>
              </div>
            )}
          </BlueprintCard>
        </Reveal>
      </div>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        {label}
      </div>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0)
    return <p className="text-xs text-muted-foreground/40 italic">None recorded</p>;
  return (
    <ul className="space-y-1.5">
      {items.map((a, i) => (
        <li
          key={i}
          className="rounded-lg border border-border/40 bg-card/20 px-3 py-2 text-xs leading-relaxed text-foreground/80"
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
