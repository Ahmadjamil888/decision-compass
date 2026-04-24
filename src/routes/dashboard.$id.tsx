import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag, Reveal } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/$id")({
  component: DecisionDetailPage,
  head: ({ data }) => ({ meta: [{ title: `${(data as any)?.title || "Decision"} — imos` }] }),
});

type Decision = {
  id: string;
  title: string | null;
  source: string | null;
  decision: string;
  reason: string | null;
  alternatives: string[];
  constraints: string[];
  tradeoffs: string[];
  expected_outcome: string;
  owner: string | null;
  contributors: string[];
  revisit_at: string | null;
  revisit_trigger: string | null;
  confidence: number;
  clarity_score: number;
  consensus_score: number;
  risk_score: number;
  reversibility_score: number;
  risk_level: string;
  conflicts: any[];
  created_at: string;
};

type Event = {
  id: string;
  kind: string;
  label: string;
  detail: string | null;
  occurred_at: string;
};

function DecisionDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<Decision | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: d, error } = await supabase
      .from("decision_threads")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      toast.error(error.message);
      navigate({ to: "/dashboard" });
      return;
    }
    setData(normalize(d));

    const { data: e } = await supabase
      .from("decision_events")
      .select("*")
      .eq("thread_id", id)
      .order("occurred_at", { ascending: true });
    setEvents(e || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading || !data) {
    return (
      <Shell variant="app">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Shell>
    );
  }

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

  return (
    <Shell variant="app">
      <Reveal className="mb-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span> Back to graph
          </button>
          <div className="flex gap-3">
            <button 
              onClick={remove}
              className="rounded-full border border-border/60 bg-card/40 px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:border-red-500/40 hover:text-red-500"
            >
              Delete Node
            </button>
            <button className="rounded-full bg-foreground px-5 py-2 font-mono text-[10px] uppercase tracking-wider text-background transition-all hover:opacity-90">
              Edit Node
            </button>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Reveal delay={100}>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Tag color="blue">{data.source}</Tag>
                <Tag color={data.risk_level === "low" ? "green" : data.risk_level === "medium" ? "amber" : "red"}>
                  {data.risk_level} risk
                </Tag>
                <div className="h-1 w-1 rounded-full bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                  {new Date(data.created_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
                {data.title || "Decision Node"}
              </h1>
              <p className="text-xl leading-relaxed text-foreground/90">
                {data.decision}
              </p>
            </div>
          </Reveal>

          {data.reason && (
            <Reveal delay={200}>
              <SectionLabel>Rationale</SectionLabel>
              <BlueprintCard className="bg-card/20">
                <p className="text-base leading-relaxed text-muted-foreground/90">{data.reason}</p>
              </BlueprintCard>
            </Reveal>
          )}

          <Reveal delay={300}>
            <div className="grid gap-8 md:grid-cols-2">
              <div>
                <SectionLabel>Trade-offs</SectionLabel>
                <List items={data.tradeoffs} />
              </div>
              <div>
                <SectionLabel>Alternatives rejected</SectionLabel>
                <List items={data.alternatives} />
              </div>
            </div>
          </Reveal>

          <Reveal delay={400}>
            <SectionLabel>Timeline</SectionLabel>
            <div className="relative space-y-6 pl-6 before:absolute before:left-[7px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border/60">
              {events.map((e, i) => (
                <div key={e.id} className="relative">
                  <div className="absolute -left-[23px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[11px] uppercase tracking-wider text-foreground">
                        {e.label}
                      </span>
                      <span className="font-mono text-[9px] text-muted-foreground/50">
                        {new Date(e.occurred_at).toLocaleDateString()}
                      </span>
                    </div>
                    {e.detail && (
                      <p className="text-sm text-muted-foreground/70">{e.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="space-y-8">
          <Reveal delay={200}>
            <SectionLabel>Node Quality</SectionLabel>
            <BlueprintCard className="space-y-6">
              <Score label="Confidence" value={data.confidence} />
              <Score label="Clarity" value={data.clarity_score} />
              <Score label="Consensus" value={data.consensus_score} />
              <Score label="Reversibility" value={data.reversibility_score} />
              <div className="pt-4 border-t border-border/40">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">Risk Profile</div>
                <div className={`h-2 w-full rounded-full bg-border/40 overflow-hidden`}>
                  <div 
                    className={`h-full transition-all duration-1000 ${data.risk_level === "low" ? "bg-green-500" : data.risk_level === "medium" ? "bg-amber-500" : "bg-red-500"}`} 
                    style={{ width: `${(data.risk_score || 0) * 100}%` }} 
                  />
                </div>
              </div>
            </BlueprintCard>
          </Reveal>

          <Reveal delay={300}>
            <SectionLabel>Owners & Context</SectionLabel>
            <BlueprintCard className="space-y-4">
              <Field label="Owner" value={data.owner || "Unassigned"} />
              <Field label="Contributors" value={data.contributors.join(", ") || "None recorded"} />
              {data.revisit_trigger && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-amber-500">Revisit Trigger</div>
                  <p className="text-sm text-foreground/90">🔔 {data.revisit_trigger}</p>
                  {data.revisit_at && (
                    <p className="mt-2 font-mono text-[10px] text-muted-foreground/60">
                      Target: {new Date(data.revisit_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </BlueprintCard>
          </Reveal>

          {data.conflicts && data.conflicts.length > 0 && (
            <Reveal delay={400}>
              <SectionLabel>Conflicts Flagged</SectionLabel>
              <div className="space-y-3">
                {data.conflicts.map((c, i) => (
                  <BlueprintCard key={i} className="border-red-500/20 bg-red-500/5">
                    <Tag color="red">{c.type}</Tag>
                    <p className="mt-3 text-sm font-medium text-foreground">{c.past_decision}</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">{c.explanation}</p>
                  </BlueprintCard>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </Shell>
  );
}

function Score({ label, value }: { label: string; value: number | null }) {
  const v = value || 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">{label}</span>
        <span className="font-mono text-[11px] text-foreground">{(v * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-border/40 overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-1000" 
          style={{ width: `${v * 100}%` }} 
        />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">{label}</div>
      <div className="text-sm text-foreground/90">{value}</div>
    </div>
  );
}

function List({ items }: { items: string[] }) {
  if (!items || items.length === 0)
    return <p className="text-xs text-muted-foreground/40 italic">None recorded</p>;
  return (
    <ul className="space-y-2">
      {items.map((a, i) => (
        <li
          key={i}
          className="rounded-xl border border-border/40 bg-card/20 px-4 py-3 text-sm leading-relaxed text-foreground/80"
        >
          {a}
        </li>
      ))}
    </ul>
  );
}

function normalize(row: any): Decision {
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
