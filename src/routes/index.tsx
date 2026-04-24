import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "IMOS — See why your code exists, instantly" },
      {
        name: "description",
        content:
          "Open a pull request and instantly see why this code exists, who decided it, and what risks it carries. Stop operating blind on legacy code.",
      },
      {
        property: "og:title",
        content: "IMOS — See why your code exists, instantly",
      },
      {
        property: "og:description",
        content:
          "Open a pull request and instantly see why this code exists, who decided it, and what risks it carries. Stop operating blind on legacy code.",
      },
    ],
  }),
});

type Phase = {
  emoji: string;
  phase: string;
  status: "live" | "next" | "soon" | "later";
  title: string;
  promise: string;
  bullets: string[];
  cta?: string;
};

const phases: Phase[] = [
  {
    emoji: "🧪",
    phase: "Phase 1",
    status: "live",
    title: "Decision extraction",
    promise: "Paste conversations → get structured decisions instantly.",
    bullets: [
      "Extracts decisions, constraints, and alternatives",
      "Builds your first decision memory in under a minute",
      "Works on Slack threads, PR discussions, meeting notes",
    ],
    cta: "You can use this today",
  },
  {
    emoji: "⚙️",
    phase: "Phase 2",
    status: "next",
    title: "Automatic capture",
    promise: "IMOS listens so your team doesn't have to document.",
    bullets: [
      "Slack + GitHub integration",
      "Decisions captured in real-time as they happen",
      "Zero workflow changes for engineers",
    ],
  },
  {
    emoji: "🧠",
    phase: "Phase 3",
    status: "soon",
    title: "Why-Graph",
    promise: "Your system starts thinking in connections.",
    bullets: [
      "Decisions linked to problems, code, and outcomes",
      "Explore the why across your entire codebase",
      "Visual graph of every engineering decision ever made",
    ],
  },
  {
    emoji: "💬",
    phase: "Phase 4",
    status: "soon",
    title: "Ask your system anything",
    promise: '"Why was this built?" — answered instantly.',
    bullets: [
      "Chat with your decision graph",
      "Context-aware answers, not generic search results",
      "No more guessing or digging through old Slack",
    ],
  },
  {
    emoji: "🚀",
    phase: "Phase 5",
    status: "later",
    title: "Built into developer workflow",
    promise: "IMOS shows up where engineers already work.",
    bullets: [
      "PR-level insights inline on every review",
      "Decision history surfaced on touched files",
      "Daily usage without friction or context-switching",
    ],
  },
  {
    emoji: "🧾",
    phase: "Phase 6",
    status: "later",
    title: "Offboarding intelligence",
    promise: "When people leave, nothing is lost.",
    bullets: [
      "Auto-generated knowledge handoff per departing engineer",
      "Full decision history, scoped per person and per system",
      "Massive value for leadership and continuity",
    ],
  },
];

const statusMap = {
  live: { color: "green" as const, label: "Available now" },
  next: { color: "blue" as const, label: "Up next" },
  soon: { color: "amber" as const, label: "Coming soon" },
  later: { color: "red" as const, label: "On the horizon" },
};

function Index() {
  const { user } = useAuth();

  return (
    <Shell>
      {/* CTA buttons under the hero */}
      <section className="mb-16">
        <div className="flex flex-wrap gap-3">
          <Link
            to={user ? "/dashboard/new" : "/signup"}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {user ? "Capture a decision →" : "Capture your first decision →"}
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-foreground/40"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* The moment IMOS clicks */}
      <section className="mb-16">
        <BlueprintCard className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            The moment IMOS clicks
          </div>
          <h2 className="font-display text-3xl leading-tight text-foreground md:text-4xl">
            Open a pull request — and instantly see why this code exists, who
            made the decision, and what risks it carries.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            That's when teams realize they can't go back. Until then, every
            engineer is operating blind on legacy code — re-litigating
            decisions that were made years ago, breaking constraints no one
            remembers.
          </p>
        </BlueprintCard>
      </section>

      {/* How IMOS evolves */}
      <section className="mb-16">
        <SectionLabel>How IMOS evolves</SectionLabel>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          We're building IMOS in layers — each one delivers real value before
          the next arrives.
        </p>
        <div className="space-y-4">
          {phases.map((p) => {
            const s = statusMap[p.status];
            return (
              <BlueprintCard key={p.phase}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                  <div className="md:w-44 md:shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{p.emoji}</span>
                      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {p.phase}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Tag color={s.color}>{s.label}</Tag>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl text-foreground">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-base leading-relaxed text-foreground/90">
                      {p.promise}
                    </p>
                    <ul className="mt-4 space-y-1.5">
                      {p.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground"
                        >
                          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    {p.cta && (
                      <div className="mt-4">
                        <Link
                          to={user ? "/dashboard/new" : "/signup"}
                          className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-primary hover:text-primary/80"
                        >
                          → {p.cta}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </BlueprintCard>
            );
          })}
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <BlueprintCard className="text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-primary">
            Start with Phase 1
          </div>
          <h3 className="font-display text-3xl text-foreground">
            Capture your first decision in under a minute.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Every phase builds on the last. The teams that start capturing
            decisions today are the ones who'll have years of institutional
            memory by the time their competitors notice it matters.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to={user ? "/dashboard/new" : "/signup"}
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {user ? "Capture a decision →" : "Try it free →"}
            </Link>
            <Link
              to="/architecture"
              className="inline-flex items-center justify-center rounded-md border border-border px-5 py-3 font-mono text-xs uppercase tracking-wider text-foreground transition-colors hover:border-foreground/40"
            >
              For builders: see the architecture
            </Link>
          </div>
        </BlueprintCard>
      </section>
    </Shell>
  );
}
