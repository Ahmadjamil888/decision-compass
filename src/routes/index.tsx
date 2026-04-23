import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Overview — Institutional Memory OS" },
      {
        name: "description",
        content:
          "The problem space, value propositions, and competitive moat behind Institutional Memory OS.",
      },
    ],
  }),
});

const stats = [
  { label: "Knowledge lost per departure", value: "~40%", sub: "operational tacit knowledge" },
  { label: "Avg. cost of knowledge loss", value: "$50K+", sub: "per senior employee exit" },
  { label: "Decisions re-litigated", value: "3× avg", sub: "without decision history" },
];

const props = [
  {
    title: "Passive capture, zero friction",
    body: "No forms, no wikis, no prompting engineers to document. The system observes Slack, GitHub, Jira, Zoom, and email — and infers decisions automatically.",
  },
  {
    title: "Why-graph, not a document store",
    body: "Traditional tools store what was decided. This stores why — the constraints, alternatives considered, and outcomes that followed.",
  },
  {
    title: "Contextual surfacing",
    body: "When a dev opens a PR touching a legacy module, the system surfaces the original decision thread, constraints at the time, and what happened when it was last changed.",
  },
  {
    title: "Organizational asset, not personal",
    body: "Knowledge is tied to the codebase, not the person. When people leave, their judgment stays. M&A teams can audit the complete cognitive history of a company.",
  },
];

function Index() {
  return (
    <Shell>
      <section className="mb-16">
        <SectionLabel>The Problem Space</SectionLabel>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((s) => (
            <BlueprintCard key={s.label}>
              <div className="text-sm text-muted-foreground">{s.label}</div>
              <div className="my-2 font-display text-5xl text-foreground">{s.value}</div>
              <div className="text-sm text-muted-foreground">{s.sub}</div>
            </BlueprintCard>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionLabel>Core Value Propositions</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          {props.map((p) => (
            <BlueprintCard key={p.title}>
              <h3 className="mb-2 text-xl text-foreground">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </BlueprintCard>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionLabel>Competitive Moat</SectionLabel>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            Glean — retrieval only
          </span>
          <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            Notion AI — manual docs
          </span>
          <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            Confluence — manual docs
          </span>
          <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
            Microsoft Viva — HR focus
          </span>
        </div>
        <div className="mt-3">
          <Tag color="green">This → passive + causal reasoning</Tag>
        </div>
      </section>

      <section>
        <Link
          to="/demo"
          className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-5 py-3 font-mono text-sm uppercase tracking-wider text-primary transition-colors hover:bg-primary/20"
        >
          Try the live decision extractor →
        </Link>
      </section>
    </Shell>
  );
}
