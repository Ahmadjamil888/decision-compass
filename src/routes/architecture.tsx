import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Reveal } from "@/components/Shell";

export const Route = createFileRoute("/architecture")({
  component: ArchPage,
  head: () => ({
    meta: [
      { title: "Architecture — imos" },
      {
        name: "description",
        content:
          "Event-sourced data flow, dual-store graph + vectors, async-first processing, and multi-tenant isolation.",
      },
    ],
  }),
});

const flow = [
  { label: "Source Events", sub: "Slack, Git, Jira, Zoom" },
  { label: "Kafka Queue", sub: "Immutable log" },
  { label: "Ingestion Service", sub: "Python / FastAPI" },
  { label: "LLM Pipeline", sub: "Decision Extractor (IMOS AI)" },
  { label: "Privacy Filter", sub: "PII redaction" },
  { label: "Graph Writer", sub: "Neo4j" },
  { label: "Vector Index", sub: "Pinecone" },
  { label: "Query API", sub: "tRPC + RAG" },
  { label: "Surface Layer", sub: "VS Code / PR Bot / Slack" },
  { label: "React Dashboard", sub: "Knowledge UI" },
];

const decisions = [
  {
    title: "Event-sourced, never destructive",
    body: "All raw events are stored immutably. The graph is derived, not primary. You can always replay and re-derive as the extraction models improve.",
  },
  {
    title: "Dual-store: graph + vectors",
    body: "Neo4j for causal relationship traversal (what led to what). Pinecone for semantic similarity (what's this similar to). Both are needed for full functionality.",
  },
  {
    title: "Async-first, non-blocking",
    body: "All extraction is async via Kafka + BullMQ. Surfacing is real-time via WebSocket. Users never wait for processing to complete.",
  },
  {
    title: "Multi-tenant, org-scoped",
    body: "Each org is a completely isolated subgraph. Knowledge never leaks between orgs. Per-user RBAC within an org (execs see all, engineers see their scope).",
  },
];

function ArchPage() {
  return (
    <Shell variant="landing">
      <Reveal className="mb-20">
        <h1 className="font-display text-5xl tracking-tight text-foreground md:text-7xl">
          The engine of <br />memory<span className="text-primary">.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground/80">
          IMOS is built on the principle of immutable event logs. We treat every 
          conversation as a raw signal that can be indexed, mapped, and queried.
        </p>
      </Reveal>

      <section className="mb-24">
        <Reveal delay={100}>
          <SectionLabel>Data Flow Architecture</SectionLabel>
        </Reveal>
        <Reveal delay={200}>
          <BlueprintCard className="overflow-x-auto">
            <div className="flex min-w-[1200px] items-center gap-2 py-4">
              {flow.map((node, i) => (
                <div key={node.label} className="flex items-center gap-2">
                  <div className="flex w-[160px] flex-col justify-center rounded-xl border border-border/60 bg-card/40 px-4 py-4 transition-all hover:border-primary/40 hover:bg-card/60">
                    <div className="mb-1.5 font-display text-sm text-foreground">{node.label}</div>
                    <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 leading-tight">
                      {node.sub}
                    </div>
                  </div>
                  {i < flow.length - 1 && (
                    <div className="text-primary/40 animate-pulse">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </BlueprintCard>
        </Reveal>
      </section>

      <section>
        <Reveal delay={300}>
          <SectionLabel>Key Architectural Decisions</SectionLabel>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          {decisions.map((d, i) => (
            <Reveal key={d.title} delay={400 + i * 100}>
              <BlueprintCard className="h-full">
                <h3 className="mb-4 font-display text-2xl tracking-tight text-foreground">{d.title}</h3>
                <p className="text-base leading-relaxed text-muted-foreground/80">{d.body}</p>
              </BlueprintCard>
            </Reveal>
          ))}
        </div>
      </section>
    </Shell>
  );
}
