import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/$id")({
  component: DecisionDetail,
  head: () => ({ meta: [{ title: "Decision — imos" }] }),
});

type Conflict = {
  past_id: string;
  past_decision: string;
  type: string;
  explanation: string;
};

type Thread = {
  id: string;
  title: string | null;
  source: string | null;
  raw_thread: string;
  decision: string;
  reason: string | null;
  alternatives: string[];
  constraints: string[];
  tradeoffs: string[];
  expected_outcome: string | null;
  owner: string | null;
  contributors: string[];
  revisit_trigger: string | null;
  revisit_at: string | null;
  relations: { type: string; target: string }[];
  confidence: number | null;
  clarity_score: number | null;
  consensus_score: number | null;
  risk_score: number | null;
  reversibility_score: number | null;
  risk_level: string | null;
  status: string | null;
  conflicts: Conflict[];
  created_at: string;
};

type Event = {
  id: string;
  kind: string;
  label: string;
  detail: string | null;
  occurred_at: string;
};

type QA = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
};

function DecisionDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [t, setT] = useState<Thread | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [qa, setQa] = useState<QA[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  const load = async () => {
    const [thread, ev, q] = await Promise.all([
      supabase.from("decision_threads").select("*").eq("id", id).single(),
      supabase.from("decision_events").select("*").eq("thread_id", id).order("occurred_at"),
      supabase.from("decision_questions").select("*").eq("thread_id", id).order("created_at"),
    ]);
    if (thread.error) {
      toast.error(thread.error.message);
      navigate({ to: "/dashboard" });
      return;
    }
    setT(normalize(thread.data));
    setEvents((ev.data ?? []) as Event[]);
    setQa((q.data ?? []) as QA[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const remove = async () => {
    if (!confirm("Delete this decision and all its history?")) return;
    const { error } = await supabase.from("decision_threads").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  };

  const markRevisited = async () => {
    if (!t || !user) return;
    await supabase.from("decision_events").insert({
      thread_id: t.id,
      user_id: user.id,
      kind: "revisited",
      label: "Decision revisited",
      detail: "User cleared the revisit alert",
    });
    await supabase
      .from("decision_threads")
      .update({ revisit_at: null, revisit_trigger: null })
      .eq("id", t.id);
    toast.success("Marked revisited");
    load();
  };

  const ask = async () => {
    if (!t || !user || !question.trim()) return;
    setAsking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ask-decision", {
        body: {
          question,
          context: {
            decision: t.decision,
            reason: t.reason,
            alternatives: t.alternatives,
            constraints: t.constraints,
            tradeoffs: t.tradeoffs,
            expected_outcome: t.expected_outcome,
            owner: t.owner,
            contributors: t.contributors,
            revisit_trigger: t.revisit_trigger,
          },
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const answer = data.answer as string;
      const { data: row } = await supabase
        .from("decision_questions")
        .insert({ thread_id: t.id, user_id: user.id, question, answer })
        .select("*")
        .single();
      if (row) setQa((prev) => [...prev, row as QA]);
      setQuestion("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ask failed");
    } finally {
      setAsking(false);
    }
  };

  if (!t) {
    return (
      <Shell variant="app">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  const revisitOverdue = t.revisit_at && new Date(t.revisit_at) < new Date();

  return (
    <Shell variant="app">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {t.source && <Tag color="blue">{t.source}</Tag>}
            {t.risk_level && (
              <Tag color={t.risk_level === "low" ? "green" : t.risk_level === "medium" ? "amber" : "red"}>
                {t.risk_level} risk
              </Tag>
            )}
            {t.owner && <Tag color="blue">owner · {t.owner}</Tag>}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {new Date(t.created_at).toLocaleString()}
            </span>
          </div>
          <h1 className="font-display text-4xl text-foreground">{t.title || "Untitled decision"}</h1>
        </div>
        <button
          onClick={remove}
          className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:border-destructive/40 hover:text-destructive"
        >
          Delete
        </button>
      </div>

      {/* Revisit alert banner */}
      {t.revisit_trigger && (
        <div
          className={cn(
            "mb-6 flex items-center justify-between gap-4 rounded-lg border p-4",
            revisitOverdue
              ? "border-tag-red-foreground/30 bg-tag-red/30"
              : "border-tag-amber-foreground/30 bg-tag-amber/40",
          )}
        >
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {revisitOverdue ? "Revisit overdue" : "Revisit alert"}
            </div>
            <p className="mt-0.5 text-sm text-foreground">🔔 {t.revisit_trigger}</p>
            {t.revisit_at && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Due {new Date(t.revisit_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <button
            onClick={markRevisited}
            className="rounded-md border border-border bg-background/60 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:border-foreground/40"
          >
            Mark revisited
          </button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <BlueprintCard>
            <SectionLabel>Decision</SectionLabel>
            <p className="text-lg leading-relaxed text-foreground">{t.decision}</p>

            {t.reason && (
              <div className="mt-6">
                <SectionLabel>Why</SectionLabel>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.reason}</p>
              </div>
            )}

            {t.expected_outcome && (
              <div className="mt-6">
                <SectionLabel>Expected outcome</SectionLabel>
                <p className="text-sm leading-relaxed text-muted-foreground">{t.expected_outcome}</p>
              </div>
            )}

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ListBlock label="Trade-offs" items={t.tradeoffs} />
              <ListBlock label="Alternatives rejected" items={t.alternatives} />
              <ListBlock label="Constraints" items={t.constraints} />
            </div>
          </BlueprintCard>

          {/* Quality scores */}
          <BlueprintCard>
            <SectionLabel>Decision quality</SectionLabel>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Score label="Clarity" value={t.clarity_score} />
              <Score label="Consensus" value={t.consensus_score} />
              <Score label="Risk" value={t.risk_score} invert />
              <Score label="Reversibility" value={t.reversibility_score} />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {qualitySummary(t)}
            </p>
          </BlueprintCard>

          {/* Conflicts */}
          {t.conflicts && t.conflicts.length > 0 && (
            <BlueprintCard>
              <SectionLabel>⚠ Conflicts detected</SectionLabel>
              <ul className="space-y-2">
                {t.conflicts.map((c, i) => (
                  <li key={i} className="rounded border border-tag-red-foreground/30 bg-tag-red/30 p-3">
                    <Tag color="red">{c.type}</Tag>
                    <p className="mt-1.5 text-sm text-foreground">{c.past_decision}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.explanation}</p>
                  </li>
                ))}
              </ul>
            </BlueprintCard>
          )}

          {/* Q&A */}
          <BlueprintCard>
            <SectionLabel>Ask this decision</SectionLabel>
            <div className="space-y-3">
              {qa.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No questions yet. Ask anything — "Why not Supabase?", "What's the risk if it fails?"
                </p>
              )}
              {qa.map((q) => (
                <div key={q.id} className="rounded-md border border-border bg-background/40 p-3">
                  <p className="mb-2 text-sm font-medium text-foreground">Q · {q.question}</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">{q.answer}</p>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") ask();
                  }}
                  placeholder="Ask a follow-up question…"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/50"
                />
                <button
                  onClick={ask}
                  disabled={asking || !question.trim()}
                  className="rounded-md bg-primary px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {asking ? "Thinking…" : "Ask"}
                </button>
              </div>
            </div>
          </BlueprintCard>
        </div>

        <div className="space-y-4">
          {/* Timeline */}
          <BlueprintCard>
            <SectionLabel>Timeline</SectionLabel>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events.</p>
            ) : (
              <ol className="space-y-3 border-l border-border pl-4">
                {events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[21px] top-1 inline-block h-2 w-2 rounded-full bg-primary" />
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(e.occurred_at).toLocaleDateString()} · {e.kind}
                    </div>
                    <p className="text-sm text-foreground">{e.label}</p>
                    {e.detail && (
                      <p className="text-xs text-muted-foreground">{e.detail}</p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </BlueprintCard>

          {/* People */}
          {(t.owner || t.contributors.length > 0) && (
            <BlueprintCard>
              <SectionLabel>People</SectionLabel>
              {t.owner && (
                <div className="mb-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Owner</div>
                  <p className="text-sm text-foreground">{t.owner}</p>
                </div>
              )}
              {t.contributors.length > 0 && (
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Contributors</div>
                  <p className="text-sm text-foreground">{t.contributors.join(", ")}</p>
                </div>
              )}
            </BlueprintCard>
          )}

          {/* Graph relations */}
          <BlueprintCard>
            <SectionLabel>Graph relations</SectionLabel>
            {t.relations.length === 0 ? (
              <p className="text-sm text-muted-foreground">None inferred.</p>
            ) : (
              <ul className="space-y-2">
                {t.relations.map((r, i) => (
                  <li key={i}>
                    <Tag color="blue">{r.type}</Tag>
                    <p className="mt-1 text-sm text-foreground">{r.target}</p>
                  </li>
                ))}
              </ul>
            )}
          </BlueprintCard>

          {/* Source */}
          <BlueprintCard>
            <SectionLabel>Source thread</SectionLabel>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {t.raw_thread}
            </pre>
          </BlueprintCard>
        </div>
      </div>
    </Shell>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      {!items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="rounded border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Score({ label, value, invert = false }: { label: string; value: number | null; invert?: boolean }) {
  const v = typeof value === "number" ? value : 0;
  const display = (v * 100).toFixed(0);
  // For "invert" (e.g. risk), high = bad
  const good = invert ? v < 0.4 : v > 0.6;
  const bad = invert ? v > 0.7 : v < 0.4;
  const tagColor = good ? "green" : bad ? "red" : "amber";
  return (
    <div>
      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-display text-2xl text-foreground">{display}%</span>
        <Tag color={tagColor as "green" | "amber" | "red"}>
          {good ? "good" : bad ? "weak" : "ok"}
        </Tag>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-muted">
        <div
          className={cn(
            "h-full rounded",
            good ? "bg-tag-green-foreground" : bad ? "bg-tag-red-foreground" : "bg-tag-amber-foreground",
          )}
          style={{ width: `${display}%` }}
        />
      </div>
    </div>
  );
}

function qualitySummary(t: Thread): string {
  const parts: string[] = [];
  if ((t.consensus_score ?? 1) < 0.5) parts.push("weak consensus");
  if ((t.risk_score ?? 0) > 0.6) parts.push("high downside risk");
  if ((t.reversibility_score ?? 1) < 0.4) parts.push("hard to reverse");
  if ((t.clarity_score ?? 1) < 0.5) parts.push("ambiguously stated");
  if (parts.length === 0) return "This decision scores well across clarity, consensus, risk, and reversibility.";
  return `Watch out: ${parts.join(", ")}.`;
}

function cn(...a: (string | false | undefined | null)[]) {
  return a.filter(Boolean).join(" ");
}

function normalize(row: any): Thread {
  return {
    ...row,
    alternatives: Array.isArray(row.alternatives) ? row.alternatives : [],
    constraints: Array.isArray(row.constraints) ? row.constraints : [],
    tradeoffs: Array.isArray(row.tradeoffs) ? row.tradeoffs : [],
    contributors: Array.isArray(row.contributors) ? row.contributors : [],
    relations: Array.isArray(row.relations) ? row.relations : [],
    conflicts: Array.isArray(row.conflicts) ? row.conflicts : [],
  };
}
