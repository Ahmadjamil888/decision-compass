import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard } from "@/components/Shell";

export const Route = createFileRoute("/stack")({
  component: StackPage,
  head: () => ({
    meta: [
      { title: "Tech Stack — Institutional Memory OS" },
      {
        name: "description",
        content:
          "Frontend, backend, AI, databases, integrations, processing, auth and infra choices for Institutional Memory OS.",
      },
    ],
  }),
});

const groups: { title: string; items: string[]; note?: string }[] = [
  {
    title: "Frontend",
    items: ["React 18", "TypeScript", "Vite", "TailwindCSS", "shadcn/ui", "TanStack Query", "Zustand"],
  },
  { title: "Graph UI", items: ["React Flow", "D3.js", "Recharts"] },
  { title: "Backend API", items: ["Node.js", "Fastify", "tRPC", "Zod", "BullMQ"] },
  {
    title: "AI / LLM",
    items: ["Lovable AI Gateway", "Gemini 3 Flash", "GPT-5", "RAG orchestration"],
    note: "Single gateway, no API key juggling.",
  },
  {
    title: "Databases",
    items: ["Neo4j (graph)", "PostgreSQL (meta)", "Pinecone (vectors)", "Redis (cache/queue)"],
    note: "Dual-store: graph for causal traversal, vectors for semantic similarity.",
  },
  {
    title: "Integrations",
    items: ["Slack Bolt SDK", "GitHub App SDK", "Google Workspace API", "Zoom Webhook", "Jira REST API"],
  },
  {
    title: "Processing",
    items: ["Python", "FastAPI", "Celery", "Whisper (audio)", "spaCy (NER)"],
    note: "Separate from Node API — Python owns ML, Node owns the realtime surface.",
  },
  { title: "Auth", items: ["Lovable Cloud Auth", "OAuth 2.0", "RBAC"] },
  { title: "Infra", items: ["AWS / GCP", "Docker", "Kubernetes", "Terraform", "Kafka", "CloudWatch"] },
  { title: "IDE Plugin", items: ["VS Code Extension API", "JetBrains SDK", "LSP"] },
];

function StackPage() {
  return (
    <Shell>
      <SectionLabel>Full Stack & Key Dependencies</SectionLabel>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groups.map((g) => (
          <BlueprintCard key={g.title}>
            <h3 className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
              {g.title}
            </h3>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {g.items.map((i) => (
                <span
                  key={i}
                  className="rounded border border-border bg-muted/60 px-2 py-1 font-mono text-xs text-foreground"
                >
                  {i}
                </span>
              ))}
            </div>
            {g.note && (
              <p className="text-xs leading-relaxed text-muted-foreground">{g.note}</p>
            )}
          </BlueprintCard>
        ))}
      </div>
    </Shell>
  );
}
