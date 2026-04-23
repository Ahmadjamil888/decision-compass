import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/demo")({
  component: DemoPage,
  head: () => ({
    meta: [
      { title: "Live Demo — Decision Extractor" },
      {
        name: "description",
        content:
          "Paste a Slack-style thread and watch the Lovable AI Decision Extractor turn it into a structured why-graph node.",
      },
    ],
  }),
});

type Decision = {
  decision: string;
  alternatives: string[];
  constraints: string[];
  expected_outcome: string;
  relations: { type: string; target: string }[];
  confidence: number;
};

const SAMPLE = `@alice 10:14 — We keep getting paged on the auth service. Postgres connections maxing out under load.
@bob 10:16 — We talked about pgbouncer last quarter but punted because it'd add infra.
@alice 10:17 — Yeah, but Cloud SQL has built-in connection pooling now. We could just flip it on.
@carol 10:21 — What about moving to a managed connection pooler like Supabase pooler? Less lock-in.
@bob 10:24 — Cloud SQL pooler is one config flag. Supabase is a migration. We have a SOC2 audit in 6 weeks — not the time.
@alice 10:26 — Agreed. Let's enable Cloud SQL connection pooling this week. Revisit Supabase pooler post-audit if we still see issues.
@carol 10:27 — 👍 Will write up the postmortem and link to this thread.`;

function DemoPage() {
  const [thread, setThread] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Decision | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("extract-decision", {
        body: { thread },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      setResult(data as Decision);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <SectionLabel>Live Decision Extractor</SectionLabel>
      <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        This is the week-1 validation experiment, running live. Paste a Slack-style
        thread, and the Lovable AI Decision Extractor returns a structured why-graph node:
        the decision, alternatives weighed, constraints, and expected outcome.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <BlueprintCard>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-mono text-xs uppercase tracking-wider text-primary">
              Input · Conversation Thread
            </h3>
            <button
              onClick={() => setThread(SAMPLE)}
              className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Reset sample
            </button>
          </div>
          <textarea
            value={thread}
            onChange={(e) => setThread(e.target.value)}
            rows={16}
            className="w-full resize-y rounded-md border border-border bg-background/60 p-3 font-mono text-xs leading-relaxed text-foreground outline-none focus:border-primary/50"
            placeholder="Paste a Slack thread, PR comments, or meeting transcript…"
          />
          <button
            onClick={run}
            disabled={loading || !thread.trim()}
            className="mt-3 inline-flex items-center justify-center rounded-md border border-primary/40 bg-primary/10 px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Extracting…" : "Extract decision →"}
          </button>
        </BlueprintCard>

        <BlueprintCard>
          <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            Output · Why-Graph Node
          </h3>

          {!result && !error && !loading && (
            <div className="flex h-full min-h-[280px] items-center justify-center text-center">
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Awaiting input…
              </p>
            </div>
          )}

          {loading && (
            <div className="flex h-full min-h-[280px] items-center justify-center">
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Reasoning over thread…
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <Field label="Decision">
                <p className="text-base leading-relaxed text-foreground">
                  {result.decision}
                </p>
                <div className="mt-2">
                  <Tag color={result.confidence > 0.7 ? "green" : result.confidence > 0.4 ? "amber" : "red"}>
                    confidence · {(result.confidence * 100).toFixed(0)}%
                  </Tag>
                </div>
              </Field>

              <Field label="Expected outcome">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.expected_outcome || "—"}
                </p>
              </Field>

              <Field label="Alternatives considered">
                {result.alternatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None recorded.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.alternatives.map((a, i) => (
                      <li
                        key={i}
                        className="rounded border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <Field label="Constraints">
                {result.constraints.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None recorded.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {result.constraints.map((c, i) => (
                      <li
                        key={i}
                        className="rounded border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </Field>

              <Field label="Graph relations">
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
              </Field>
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
