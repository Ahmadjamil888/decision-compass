import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
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
  confidence: number | null;
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
      .select("id, title, source, decision, confidence, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows(data as ThreadRow[]);
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

  const filtered =
    rows?.filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.decision.toLowerCase().includes(q) ||
        (r.title ?? "").toLowerCase().includes(q) ||
        (r.source ?? "").toLowerCase().includes(q)
      );
    }) ?? null;

  return (
    <Shell variant="app">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Welcome back
          </div>
          <h1 className="font-display text-4xl text-foreground">
            {user?.user_metadata?.display_name || user?.email?.split("@")[0]}'s graph
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows === null
              ? "Loading…"
              : `${rows.length} decision${rows.length === 1 ? "" : "s"} captured`}
          </p>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard/new" })}
          className="rounded-md bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
        >
          + Capture decision
        </button>
      </div>

      <div className="mb-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search decisions, titles, sources…"
          className="w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/50"
        />
      </div>

      <SectionLabel>Decisions</SectionLabel>

      {filtered === null ? (
        <BlueprintCard>
          <p className="text-sm text-muted-foreground">Loading your graph…</p>
        </BlueprintCard>
      ) : filtered.length === 0 ? (
        <BlueprintCard className="text-center">
          <h3 className="font-display text-2xl text-foreground">
            {rows && rows.length === 0 ? "Your graph is empty" : "No matches"}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {rows && rows.length === 0
              ? "Paste a Slack thread, PR discussion, or meeting notes — the AI extracts the decision and saves it as a node."
              : "Try a different search."}
          </p>
          {rows && rows.length === 0 && (
            <Link
              to="/dashboard/new"
              className="mt-5 inline-flex rounded-md bg-primary px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground hover:bg-primary/90"
            >
              Capture your first decision →
            </Link>
          )}
        </BlueprintCard>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <BlueprintCard key={r.id}>
              <div className="flex items-start justify-between gap-4">
                <Link
                  to="/dashboard/$id"
                  params={{ id: r.id }}
                  className="flex-1 group"
                >
                  <div className="mb-1 flex items-center gap-2">
                    {r.source && <Tag color="blue">{r.source}</Tag>}
                    {typeof r.confidence === "number" && (
                      <Tag
                        color={
                          r.confidence > 0.7 ? "green" : r.confidence > 0.4 ? "amber" : "red"
                        }
                      >
                        {(r.confidence * 100).toFixed(0)}% confidence
                      </Tag>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.title && (
                    <div className="mb-1 text-sm text-muted-foreground">{r.title}</div>
                  )}
                  <p className="text-base leading-snug text-foreground group-hover:text-primary">
                    {r.decision}
                  </p>
                </Link>
                <button
                  onClick={() => remove(r.id)}
                  className="rounded-md border border-border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                >
                  Delete
                </button>
              </div>
            </BlueprintCard>
          ))}
        </div>
      )}
    </Shell>
  );
}
