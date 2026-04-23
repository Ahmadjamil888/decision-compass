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

type Decision = {
  decision: string;
  alternatives: string[];
  constraints: string[];
  expected_outcome: string;
  relations: { type: string; target: string }[];
  confidence: number;
};

function NewDecisionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [thread, setThread] = useState(SAMPLE);
  const [title, setTitle] = useState("");
  const [source, setSource] = useState("Slack");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Decision | null>(null);

  const extract = async () => {
    setExtracting(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("extract-decision", {
        body: { thread },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setResult(data as Decision);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  };

  const save = async () => {
    if (!result || !user) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("decision_threads")
      .insert({
        user_id: user.id,
        title: title.trim() || null,
        source: source.trim() || null,
        raw_thread: thread,
        decision: result.decision,
        alternatives: result.alternatives,
        constraints: result.constraints,
        expected_outcome: result.expected_outcome,
        relations: result.relations,
        confidence: result.confidence,
      })
      .select("id")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
          Paste a conversation, then let the AI extract the decision structure. Review and
          save it to your graph.
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
            Output · Why-graph node
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
                Reasoning over thread…
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <ResultField label="Decision">
                <p className="text-base leading-relaxed text-foreground">{result.decision}</p>
                <div className="mt-2">
                  <Tag
                    color={
                      result.confidence > 0.7
                        ? "green"
                        : result.confidence > 0.4
                          ? "amber"
                          : "red"
                    }
                  >
                    confidence · {(result.confidence * 100).toFixed(0)}%
                  </Tag>
                </div>
              </ResultField>

              <ResultField label="Expected outcome">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.expected_outcome || "—"}
                </p>
              </ResultField>

              <ResultField label="Alternatives">
                <ListBlock items={result.alternatives} />
              </ResultField>

              <ResultField label="Constraints">
                <ListBlock items={result.constraints} />
              </ResultField>

              <ResultField label="Graph relations">
                {result.relations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None inferred.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.relations.map((r, i) => (
                      <li key={i} className="flex items-baseline gap-2">
                        <span className="rounded bg-tag-blue px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tag-blue-foreground">
                          {r.type}
                        </span>
                        <span className="text-sm text-foreground">{r.target}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </ResultField>

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

function ResultField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ListBlock({ items }: { items: string[] }) {
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
