import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Institutional Memory OS — Decision history that survives turnover" },
      {
        name: "description",
        content:
          "Capture decisions from your team's conversations and turn them into a queryable why-graph. Powered by Lovable AI.",
      },
      {
        property: "og:title",
        content: "Institutional Memory OS — Decision history that survives turnover",
      },
      {
        property: "og:description",
        content:
          "Capture decisions from your team's conversations and turn them into a queryable why-graph. Powered by Lovable AI.",
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
    body: "Knowledge is tied to the codebase, not the person. When people leave, their judgment stays. M&A teams can audit complete cognitive history.",
  },
];

function Index() {
  const { user } = useAuth();
  return (
    <Shell>
      <section className="mb-12">
        <div className="mb-6 flex flex-wrap gap-2">
          <Tag color="blue">AI-native</Tag>
          <Tag color="green">SaaS</Tag>
          <Tag color="amber">Knowledge Infrastructure</Tag>
          <Tag color="red">High moat</Tag>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to={user ? "/dashboard" : "/signup"}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {user ? "Open dashboard →" : "Start capturing decisions →"}
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-foreground/40"
          >
            See how it works
          </Link>
        </div>
      </section>

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
          <Tag color="green">imos → passive + causal reasoning</Tag>
        </div>
      </section>

      <section>
        <BlueprintCard className="text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            MVP — live now
          </div>
          <h3 className="font-display text-3xl text-foreground">
            Paste a thread. Get a structured decision.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Sign up, paste any conversation thread (Slack, PR, meeting notes), and the AI
            extracts the decision, alternatives, constraints, and expected outcome — saved
            to your private decision graph.
          </p>
          <div className="mt-5">
            <Link
              to={user ? "/dashboard/new" : "/signup"}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {user ? "Capture a decision →" : "Try it free →"}
            </Link>
          </div>
        </BlueprintCard>
      </section>
    </Shell>
  );
}
