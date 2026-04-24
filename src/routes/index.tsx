import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell, SectionLabel, BlueprintCard, Reveal } from "@/components/Shell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <Shell variant="landing">
      {/* Hero Section */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center pt-20 text-center">
        {/* Ambient background glow */}
        <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
        
        <Reveal>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">v1.0.4 Now Live</span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="max-w-4xl font-display text-6xl leading-[1.05] tracking-tight text-foreground md:text-8xl">
            Institutional Memory <br />
            for fast teams<span className="text-primary">.</span>
          </h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground/80 md:text-xl">
            IMOS captures the "why" behind your decisions. We index conversations 
            from Slack, PRs, and meetings to build a living graph of your company's intent.
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate({ to: user ? "/dashboard" : "/signup" })}
              className="group relative overflow-hidden rounded-full bg-foreground px-8 py-4 font-mono text-[12px] uppercase tracking-widest text-background transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {user ? "Go to Dashboard" : "Start your graph"}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </button>
            <Link
              to="/architecture"
              className="rounded-full border border-border/60 bg-card/40 px-8 py-4 font-mono text-[12px] uppercase tracking-widest text-foreground transition-all duration-300 hover:border-foreground/30 hover:bg-card/60"
            >
              System Architecture
            </Link>
          </div>
        </Reveal>

        {/* Scroll indicator */}
        <Reveal delay={1000} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-3">
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">Scroll to explore</span>
            <div className="h-12 w-px bg-gradient-to-b from-border/60 to-transparent" />
          </div>
        </Reveal>
      </section>

      {/* Feature Grid */}
      <section className="py-32">
        <Reveal>
          <SectionLabel>The Core Engine</SectionLabel>
        </Reveal>
        
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Reveal delay={100}>
            <BlueprintCard className="group h-full transition-all hover:-translate-y-1">
              <div className="mb-6 rounded-2xl bg-blue-500/10 p-4 text-blue-500 w-fit group-hover:bg-blue-500/20 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <h3 className="mb-3 font-display text-2xl text-foreground">AI Extraction</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">
                Paste raw Slack threads or PR comments. IMOS automatically extracts the decision, rationale, and alternatives rejected.
              </p>
            </BlueprintCard>
          </Reveal>

          <Reveal delay={200}>
            <BlueprintCard className="group h-full transition-all hover:-translate-y-1">
              <div className="mb-6 rounded-2xl bg-amber-500/10 p-4 text-amber-500 w-fit group-hover:bg-amber-500/20 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="mb-3 font-display text-2xl text-foreground">Conflict Detection</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">
                IMOS cross-references every new decision against your entire history, flagging contradictions before they become tech debt.
              </p>
            </BlueprintCard>
          </Reveal>

          <Reveal delay={300}>
            <BlueprintCard className="group h-full transition-all hover:-translate-y-1">
              <div className="mb-6 rounded-2xl bg-emerald-500/10 p-4 text-emerald-500 w-fit group-hover:bg-emerald-500/20 transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h3 className="mb-3 font-display text-2xl text-foreground">Decision Quality</h3>
              <p className="text-sm leading-relaxed text-muted-foreground/70">
                Quantitative scoring for clarity, consensus, and reversibility. Know when a decision is a "one-way door."
              </p>
            </BlueprintCard>
          </Reveal>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="py-24 border-t border-border/40">
        <Reveal>
          <div className="text-center">
            <SectionLabel className="mx-auto mb-10">Built for modern engineering cultures</SectionLabel>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-40 grayscale transition-all hover:grayscale-0">
              <span className="font-display text-2xl tracking-tighter text-foreground">Linear</span>
              <span className="font-display text-2xl tracking-tighter text-foreground">Vercel</span>
              <span className="font-display text-2xl tracking-tighter text-foreground">Supabase</span>
              <span className="font-display text-2xl tracking-tighter text-foreground">Cursor</span>
              <span className="font-display text-2xl tracking-tighter text-foreground">Stripe</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA Footer */}
      <section className="py-32">
        <Reveal>
          <BlueprintCard className="relative overflow-hidden bg-foreground py-20 text-center">
            {/* Background pattern */}
            <div className="absolute inset-0 -z-10 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
            
            <h2 className="font-display text-4xl text-background md:text-6xl">
              Ready to stop <br />repeating yourselves?
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-background/60">
              Join the waitlist for the Enterprise edition or start your personal 
              decision graph today for free.
            </p>
            <button
              onClick={() => navigate({ to: "/signup" })}
              className="mt-10 rounded-full bg-background px-10 py-4 font-mono text-[12px] uppercase tracking-widest text-foreground transition-all hover:opacity-90 active:scale-[0.95]"
            >
              Create your account
            </button>
          </BlueprintCard>
        </Reveal>
      </section>
    </Shell>
  );
}
