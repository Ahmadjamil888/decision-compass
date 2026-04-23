import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
  head: () => ({
    meta: [
      { title: "MVP Roadmap — Institutional Memory OS" },
      {
        name: "description",
        content:
          "12-week MVP plan: Slack ingestion, decision extractor, why-graph, PR bot, and offboarding report.",
      },
    ],
  }),
});

const phases = [
  {
    weeks: "Week 1",
    title: "Validation",
    tag: "validate" as const,
    body: "10 anonymized Slack exports → Lovable AI extraction prompt → manual eval. If decision extraction is good enough on raw data, the rest is plumbing.",
  },
  {
    weeks: "Weeks 2–4",
    title: "Slack ingestion + extractor",
    tag: "build" as const,
    body: "Slack OAuth + event stream into BullMQ. Lovable AI pipeline extracts decisions, alternatives, constraints, outcomes. Store raw + structured.",
  },
  {
    weeks: "Weeks 5–6",
    title: "Why-graph v1",
    tag: "build" as const,
    body: "Neo4j schema (Decision, Alternative, Constraint, Outcome). Graph writer with 'led_to', 'contradicts', 'informed_by' edges. Basic visualization.",
  },
  {
    weeks: "Weeks 7–8",
    title: "Knowledge chat + RAG",
    tag: "build" as const,
    body: "Vector index (Pinecone). RAG-over-graph: semantic retrieval narrows to candidate nodes, graph walk supplies the why. tRPC query API.",
  },
  {
    weeks: "Weeks 9–10",
    title: "GitHub PR bot",
    tag: "growth" as const,
    body: "The killer feature. Every engineer sees it on every PR — daily active usage and word-of-mouth in one. Inline decision history on touched files.",
  },
  {
    weeks: "Weeks 11–12",
    title: "Offboarding intelligence",
    tag: "wedge" as const,
    body: "Enterprise sales wedge. Auto-generate handoff report when employee marked departing. CHROs and CTOs pay for this report alone.",
  },
];

const tagColor = {
  validate: "amber",
  build: "blue",
  growth: "green",
  wedge: "red",
} as const;

function RoadmapPage() {
  return (
    <Shell>
      <section className="mb-12">
        <SectionLabel>What to build first</SectionLabel>
        <BlueprintCard>
          <p className="text-base leading-relaxed text-foreground">
            <span className="font-display text-2xl text-primary">Skip the full stack.</span>{" "}
            Take 10 Slack exports from a real company, anonymize them, run them through a
            Lovable AI prompt asking for decision extraction, and manually evaluate the
            quality. If extraction is good on raw data, everything else is plumbing.
          </p>
        </BlueprintCard>
      </section>

      <section>
        <SectionLabel>12-Week MVP Sequence</SectionLabel>
        <div className="space-y-3">
          {phases.map((p) => (
            <BlueprintCard key={p.title}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start">
                <div className="md:w-40 md:shrink-0">
                  <div className="font-mono text-xs uppercase tracking-wider text-primary">
                    {p.weeks}
                  </div>
                  <div className="mt-1">
                    <Tag color={tagColor[p.tag]}>{p.tag}</Tag>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg text-foreground">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </div>
            </BlueprintCard>
          ))}
        </div>
      </section>
    </Shell>
  );
}
