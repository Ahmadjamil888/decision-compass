import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const tabs = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/architecture", label: "Architecture" },
] as const;

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
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-6xl px-6 py-8 md:px-10 md:py-12">
        <div className="mb-10 flex items-start justify-between gap-4">
          <Link to="/" className="block">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Institutional Memory OS
            </div>
            <div className="mt-1 font-display text-2xl text-foreground">imos<span className="text-primary">.</span></div>
          </Link>
          <div className="flex items-center gap-2">
            {variant === "marketing" && (
              <nav className="hidden items-center gap-1 md:flex">
                {tabs.map((t) => {
                  const active = location.pathname === t.to;
                  return (
                    <Link
                      key={t.to}
                      to={t.to}
                      className={cn(
                        "rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
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
                    "rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                    location.pathname.startsWith("/dashboard")
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-foreground hover:border-foreground/40",
                  )}
                >
                  Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                  }}
                  className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Sign out
                </button>
              </>
            ) : !loading ? (
              <>
                <Link
                  to="/login"
                  search={{ redirect: "/dashboard" }}
                  className="rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-md bg-primary px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
                >
                  Get started
                </Link>
              </>
            ) : null}
          </div>
        </div>

        {variant === "marketing" && !hideHero && (
          <header className="mb-12">
            <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {location.pathname === "/" ? "v0.1 — Live MVP" : "Product"}
            </div>
            <h1 className="font-display text-4xl leading-[1.05] text-foreground md:text-6xl">
              {pageTitle(location.pathname)}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {pageSubtitle(location.pathname)}
            </p>
          </header>
        )}

        <main>{children}</main>

        <footer className="mt-24 border-t border-border pt-6 font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Institutional Memory OS · Powered by Lovable Cloud + AI
        </footer>
      </div>
    </div>
  );
}

function pageTitle(pathname: string) {
  if (pathname === "/features") return "Every feature, one purpose.";
  if (pathname === "/architecture") return "Architecture";
  return "Institutional Memory OS";
}
function pageSubtitle(pathname: string) {
  if (pathname === "/features")
    return "Eight modules that turn passive activity into queryable institutional knowledge.";
  if (pathname === "/architecture")
    return "Event-sourced, dual-store, async-first, and multi-tenant by design.";
  return "If you don't capture decisions, your team operates blind on legacy code — re-litigating choices made years ago, breaking constraints no one remembers.";
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
