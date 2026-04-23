import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Overview" },
  { to: "/features", label: "Features" },
  { to: "/stack", label: "Tech Stack" },
  { to: "/architecture", label: "Architecture" },
  { to: "/roadmap", label: "MVP Roadmap" },
  { to: "/demo", label: "Live Demo" },
] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
        <header className="mb-10">
          <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Blueprint · v0.1
          </div>
          <h1 className="font-display text-4xl leading-[1.05] text-foreground md:text-6xl">
            Institutional Memory OS
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            A passive knowledge capture system that turns organizational activity into a
            living, queryable decision graph — so expertise survives headcount turnover.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Tag color="blue">AI-native</Tag>
            <Tag color="green">SaaS</Tag>
            <Tag color="amber">Knowledge Infrastructure</Tag>
            <Tag color="red">High moat</Tag>
          </div>
        </header>

        <nav className="mb-10 border-y border-border py-3">
          <div className="-mx-2 flex flex-wrap gap-1">
            {tabs.map((t) => {
              const active = location.pathname === t.to;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "rounded-full border px-4 py-2 font-mono text-xs uppercase tracking-wider transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main>{children}</main>

        <footer className="mt-24 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Institutional Memory OS — App Blueprint · Powered by Lovable Cloud + AI
        </footer>
      </div>
    </div>
  );
}

export function Tag({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red";
}) {
  const map = {
    blue: "bg-tag-blue text-tag-blue-foreground border-tag-blue-foreground/20",
    green: "bg-tag-green text-tag-green-foreground border-tag-green-foreground/20",
    amber: "bg-tag-amber text-tag-amber-foreground border-tag-amber-foreground/20",
    red: "bg-tag-red text-tag-red-foreground border-tag-red-foreground/20",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-1 font-mono text-xs",
        map[color],
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}

export function BlueprintCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card/60 p-6 backdrop-blur-sm transition-colors hover:border-foreground/20",
        className,
      )}
    >
      {children}
    </div>
  );
}
