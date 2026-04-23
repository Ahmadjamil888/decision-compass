import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard } from "@/components/Shell";

export const Route = createFileRoute("/architecture")({
  component: ArchPage,
  head: () => ({
    meta: [
      { title: "Architecture — Institutional Memory OS" },
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
  { label: "LLM Pipeline", sub: "Decision Extractor (Lovable AI)" },
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
    <Shell>
      <section className="mb-16">
        <SectionLabel>Data Flow Architecture</SectionLabel>
        <BlueprintCard>
          <div className="flex flex-wrap items-stretch gap-2">
            {flow.map((node, i) => (
              <div key={node.label} className="flex items-stretch">
                <div className="flex min-w-[160px] flex-col justify-center rounded-md border border-border bg-muted/40 px-3 py-2.5">
                  <div className="text-sm text-foreground">{node.label}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {node.sub}
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <div className="flex items-center px-1 text-primary/60">→</div>
                )}
              </div>
            ))}
          </div>
        </BlueprintCard>
      </section>

      <section>
        <SectionLabel>Key Architectural Decisions</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {decisions.map((d) => (
            <BlueprintCard key={d.title}>
              <h3 className="mb-2 text-lg text-foreground">{d.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{d.body}</p>
            </BlueprintCard>
          ))}
        </div>
      </section>
    </Shell>
  );
}
