import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag, Reveal } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
  head: () => ({ meta: [{ title: "Dashboard — imos" }] }),
});

type ThreadRow = {
  id: string;
  title: string | null;
  source: string | null;
  decision: string;
  owner: string | null;
  confidence: number | null;
  risk_level: string | null;
  revisit_at: string | null;
  revisit_trigger: string | null;
  conflicts: { type: string }[];
  created_at: string;
};

function DashboardIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ThreadRow[] | null>(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data, error } = await supabase
      .from("decision_threads")
      .select("id, title, source, decision, owner, confidence, risk_level, revisit_at, revisit_trigger, conflicts, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []).map((r: any) => ({
      ...r,
      conflicts: Array.isArray(r.conflicts) ? r.conflicts : [],
    })) as ThreadRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Delete this decision?")) return;
    const { error } = await supabase.from("decision_threads").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
    toast.success("Deleted");
  };

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.decision.toLowerCase().includes(q) ||
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.source ?? "").toLowerCase().includes(q) ||
        (r.owner ?? "").toLowerCase().includes(q),
    );
  }, [rows, search]);

  const revisits = useMemo(() => {
    if (!rows) return [];
    const now = Date.now();
    return rows.filter(
      (r) => r.revisit_trigger && (!r.revisit_at || new Date(r.revisit_at).getTime() < now + 7 * 86400_000),
    );
  }, [rows]);

  const conflictCount = useMemo(
    () => (rows ?? []).reduce((n, r) => n + (r.conflicts?.length ?? 0), 0),
    [rows],
  );

  return (
    <Shell variant="app">
      <Reveal className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60">
              Personal Workspace
            </div>
            <h1 className="font-display text-4xl tracking-tight text-foreground md:text-5xl">
              {user?.user_metadata?.display_name || user?.email?.split("@")[0]}'s graph<span className="text-primary">.</span>
            </h1>
            <p className="text-sm text-muted-foreground/80">
              {rows === null
                ? "Indexing your institutional memory…"
                : `${rows.length} decision${rows.length === 1 ? "" : "s"} captured · ${conflictCount} conflict${conflictCount === 1 ? "" : "s"} flagged`}
            </p>
          </div>
          <button
            onClick={() => navigate({ to: "/dashboard/new" })}
            className="group relative overflow-hidden rounded-full bg-primary px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition-all duration-300 hover:bg-primary/90 active:scale-[0.98] hover:shadow-xl hover:shadow-primary/10"
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-lg">+</span> Capture decision
            </span>
          </button>
        </div>
      </Reveal>

      {/* Revisit alerts */}
      {revisits.length > 0 && (
        <Reveal delay={100} className="mb-8">
          <BlueprintCard className="border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40">
            <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
              </span>
              Revisit alerts ({revisits.length})
            </div>
            <ul className="divide-y divide-amber-500/10">
              {revisits.map((r) => (
                <li key={r.id} className="group flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1">
                    <Link
                      to="/dashboard/$id"
                      params={{ id: r.id }}
                      className="text-sm font-medium text-foreground transition-colors hover:text-amber-500"
                    >
                      {r.title || r.decision}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">{r.revisit_trigger}</p>
                  </div>
                  {r.revisit_at && (
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                      due {new Date(r.revisit_at).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </BlueprintCard>
        </Reveal>
      )}

      <Reveal delay={200} className="mb-10">
        <div className="relative">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions, owners, or keywords…"
            className="w-full rounded-2xl border border-border/60 bg-card/40 px-6 py-4 font-mono text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/40 focus:border-primary/40 focus:bg-card/60 focus:ring-4 focus:ring-primary/5"
          />
          <div className="absolute right-6 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
            {search ? `${filtered?.length || 0} found` : "Filter nodes"}
          </div>
        </div>
      </Reveal>

      <Reveal delay={300}>
        <SectionLabel>Captured Nodes</SectionLabel>
      </Reveal>

      {filtered === null ? (
        <Reveal delay={400}>
          <BlueprintCard className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground/60">Indexing Graph…</p>
            </div>
          </BlueprintCard>
        </Reveal>
      ) : filtered.length === 0 ? (
        <Reveal delay={400}>
          <BlueprintCard className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-6 rounded-full bg-primary/5 p-8">
              <div className="h-12 w-12 text-primary/40">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <h3 className="font-display text-2xl tracking-tight text-foreground">
              {rows && rows.length === 0 ? "Your graph is empty" : "No nodes found"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground/70">
              {rows && rows.length === 0
                ? "Capture threads from Slack, PRs, or meetings. IMOS extracts the intent and links it to your institutional memory."
                : `No results matching "${search}". Try searching for different keywords or owners.`}
            </p>
            {rows && rows.length === 0 && (
              <button
                onClick={() => navigate({ to: "/dashboard/new" })}
                className="mt-8 rounded-full bg-primary px-8 py-3.5 font-mono text-[11px] uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90"
              >
                Capture your first decision →
              </button>
            )}
          </BlueprintCard>
        </Reveal>
      ) : (
        <div className="grid gap-4">
          {filtered.map((r, i) => (
            <Reveal key={r.id} delay={400 + i * 50}>
              <BlueprintCard className="overflow-hidden">
                <div className="flex items-start justify-between gap-6">
                  <Link
                    to="/dashboard/$id"
                    params={{ id: r.id }}
                    className="group flex-1"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {r.source && <Tag color="blue">{r.source}</Tag>}
                      {r.risk_level && (
                        <Tag color={r.risk_level === "low" ? "green" : r.risk_level === "medium" ? "amber" : "red"}>
                          {r.risk_level} risk
                        </Tag>
                      )}
                      {r.owner && (
                        <span className="font-mono text-[10px] text-muted-foreground/60">
                          by <span className="text-foreground/80">{r.owner}</span>
                        </span>
                      )}
                      <div className="h-1 w-1 rounded-full bg-border" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.title && (
                      <div className="mb-2 font-display text-xl tracking-tight text-foreground transition-colors group-hover:text-primary">
                        {r.title}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed text-muted-foreground transition-colors group-hover:text-muted-foreground/80">
                      {r.decision}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {r.conflicts?.length > 0 && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-500">
                          ⚠ {r.conflicts.length} Conflict
                        </span>
                      )}
                      {r.revisit_trigger && (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-amber-500">
                          🔔 Revisit
                        </span>
                      )}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-primary">
                        View Node →
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-full border border-border/60 bg-card/40 px-4 py-1.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 transition-all hover:border-red-500/40 hover:bg-red-500/5 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </BlueprintCard>
            </Reveal>
          ))}
        </div>
      )}
    </Shell>
  );
}

