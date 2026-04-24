import { createFileRoute } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard } from "@/components/Shell";

export const Route = createFileRoute("/features")({
  component: FeaturesPage,
  head: () => ({
    meta: [
      { title: "Features — Institutional Memory OS" },
      {
        name: "description",
        content:
          "Eight core modules: passive observer, decision extractor, why-graph, contextual surfacing, knowledge chat, repeat-mistake detector, offboarding intelligence, and privacy layer.",
      },
    ],
  }),
});

const features = [
  {
    icon: "🕵️",
    title: "Passive Observer Agent",
    body: "Background daemon that connects to Slack, GitHub, Jira, Zoom, email via OAuth. Streams events into a processing queue. Zero UI interaction required from users.",
  },
  {
    icon: "🧠",
    title: "Decision Extractor (LLM Pipeline)",
    body: "IMOS pipeline that reads conversation threads and infers: what decision was made, what alternatives were discussed, what constraints existed, and what was the expected outcome.",
  },
  {
    icon: "🕸️",
    title: "Why-Graph Builder",
    body: "Stores decisions as nodes in a graph DB (Neo4j). Edges encode: 'led to', 'contradicts', 'was informed by', 'outcome was'. Temporal versioning tracks how reasoning evolved.",
  },
  {
    icon: "🔔",
    title: "Contextual Surfacing (IDE + PR + Slack)",
    body: "VS Code extension, GitHub PR bot, and Slack app. Triggers on file open, PR creation, or @mention. Surfaces relevant decision history inline without interrupting flow.",
  },
  {
    icon: "💬",
    title: "Knowledge Chat Interface",
    body: "Natural language query over the org's decision history. \"Why did we switch to PostgreSQL?\" or \"What did the team decide about mobile auth in 2023?\" returns sourced, contextual answers.",
  },
  {
    icon: "⚠️",
    title: "Repeat Mistake Detector",
    body: "Semantic similarity search over past failed decisions. When a PR or thread resembles a past failure pattern, sends a proactive alert: \"In 2022, three engineers tried this approach. Here's what happened.\"",
  },
  {
    icon: "🏢",
    title: "Offboarding Intelligence Report",
    body: "When an employee is marked as departing, auto-generates a structured knowledge handoff: decisions they owned, unresolved threads, tribal knowledge only they hold — ready for their replacement.",
  },
  {
    icon: "🔐",
    title: "Privacy & Consent Layer",
    body: "Per-user opt-in/out. Redaction engine removes PII, personal sentiment, and HR content before storage. SOC2 compliant. Audit log of all queries. Legal review mode for M&A due diligence.",
  },
];

function FeaturesPage() {
  return (
    <Shell>
      <SectionLabel>Core Feature Modules</SectionLabel>
      <div className="grid gap-4 md:grid-cols-2">
        {features.map((f) => (
          <BlueprintCard key={f.title}>
            <div className="mb-3 text-3xl">{f.icon}</div>
            <h3 className="mb-2 text-xl text-foreground">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </BlueprintCard>
        ))}
      </div>
    </Shell>
  );
}
