import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/architecture", label: "Architecture" },
] as const;

export function useScrollReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
        visible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0",
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Shell({
  children,
  hideHero = false,
  variant = "marketing",
}: {
  children: React.ReactNode;
  hideHero?: boolean;
  variant?: "marketing" | "app";
}) {
  const location = useLocation();
  const { user, signOut, loading } = useAuth();

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">

        {/* Floating glass pill nav — detached from top edge */}
        <div className="mb-14 flex items-start justify-between gap-4">
          <Link to="/" className="group block">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground transition-colors group-hover:text-foreground/70">
              Institutional Memory OS
            </div>
            <div className="mt-1 font-display text-2xl tracking-tight text-foreground">
              imos<span className="text-primary">.</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {variant === "marketing" && (
              <nav className="hidden items-center gap-1 md:flex">
                {tabs.map((t, i) => {
                  const active = location.pathname === t.to;
                  return (
                    <Link
                      key={t.to}
                      to={t.to}
                      className={cn(
                        "relative rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]",
                      )}
                      style={{ transitionDelay: `${i * 50}ms` }}
                    >
                      {active && (
                        <span className="absolute inset-0 rounded-full ring-1 ring-primary/20" />
                      )}
                      {t.label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {!loading && user ? (
              <>
                <Link
                  to="/dashboard"
                  className={cn(
                    "group relative rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    location.pathname.startsWith("/dashboard")
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-white/[0.04]"
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => { await signOut(); }}
                  className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-white/[0.04]"
                >
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  to="/login"
                  search={{ redirect: "/dashboard" }}
                  className="rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground transition-all duration-300 hover:text-foreground hover:bg-white/[0.04]"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="group relative rounded-full bg-primary px-5 py-2 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:bg-primary/90 active:scale-[0.98]"
                >
                  <span className="relative z-10">Get started</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {variant === "marketing" && !hideHero && (
          <Reveal>
            <header className="mb-16">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  {location.pathname === "/" ? "v0.1 — Live MVP" : "Product"}
                </span>
              </div>
              <h1 className="font-display text-5xl leading-[1.02] tracking-tight text-foreground md:text-7xl">
                {pageTitle(location.pathname)}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
                {pageSubtitle(location.pathname)}
              </p>
            </header>
          </Reveal>
        )}

        <main>{children}</main>

        {/* Premium footer — Double-bezel architecture */}
        <footer className="mt-24 rounded-[2rem] border border-border/40 bg-card/30 p-6 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between gap-3 md:flex-row">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Institutional Memory OS · {new Date().getFullYear()}
            </div>
            <div className="flex items-center gap-6">
              <Link to="/features" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                Features
              </Link>
              <Link to="/architecture" className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground">
                Architecture
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/features") return "Every feature, one purpose.";
  if (pathname === "/architecture") return "Architecture";
  return "See why your code exists.";
}
function pageSubtitle(pathname: string) {
  if (pathname === "/features")
    return "Eight modules that turn passive activity into queryable institutional knowledge.";
  if (pathname === "/architecture")
    return "Event-sourced, dual-store, async-first, and multi-tenant by design.";
  return "Open a pull request — and instantly see why this code exists, who decided it, and what risks it carries.";
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
        "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px]",
        map[color],
      )}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-border/0 via-border to-border/0" />
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 shrink-0">
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-border/0" />
    </div>
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
        "group relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-foreground/20 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5",
        className,
      )}
    >
      {/* Inner highlight for Double-Bezel depth */}
      <div className="absolute inset-px rounded-[calc(2rem-1px)] bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
