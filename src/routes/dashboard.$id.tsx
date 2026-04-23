import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell, SectionLabel, BlueprintCard, Tag } from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/$id")({
  component: DecisionDetail,
  head: () => ({ meta: [{ title: "Decision — imos" }] }),
});

type Thread = {
  id: string;
  title: string | null;
  source: string | null;
  raw_thread: string;
  decision: string;
  alternatives: string[];
  constraints: string[];
  expected_outcome: string | null;
  relations: { type: string; target: string }[];
  confidence: number | null;
  created_at: string;
};

function DecisionDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [t, setT] = useState<Thread | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Thread | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("decision_threads")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        toast.error(error.message);
        navigate({ to: "/dashboard" });
        return;
      }
      setT(normalize(data));
    })();
  }, [id, navigate]);

  const startEdit = () => {
    if (!t) return;
    setDraft({ ...t });
    setEditing(true);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    const { error } = await supabase
      .from("decision_threads")
      .update({
        title: draft.title?.trim() || null,
        source: draft.source?.trim() || null,
        decision: draft.decision,
        expected_outcome: draft.expected_outcome,
        alternatives: draft.alternatives,
        constraints: draft.constraints,
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setT(draft);
    setEditing(false);
    toast.success("Updated");
  };

  const remove = async () => {
    if (!confirm("Delete this decision?")) return;
    const { error } = await supabase.from("decision_threads").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    navigate({ to: "/dashboard" });
  };

  if (!t) {
    return (
      <Shell variant="app">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </Shell>
    );
  }

  const view = editing && draft ? draft : t;

  return (
    <Shell variant="app">
      <button
        onClick={() => navigate({ to: "/dashboard" })}
        className="mb-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        ← Back to dashboard
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            {view.source && <Tag color="blue">{view.source}</Tag>}
            {typeof view.confidence === "number" && (
              <Tag
                color={
                  view.confidence > 0.7 ? "green" : view.confidence > 0.4 ? "amber" : "red"
                }
              >
                {(view.confidence * 100).toFixed(0)}% confidence
              </Tag>
            )}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {new Date(t.created_at).toLocaleString()}
            </span>
          </div>
          {editing ? (
            <input
              value={draft?.title ?? ""}
              onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
              placeholder="Title"
              className="rounded-md border border-border bg-background px-3 py-1.5 font-display text-3xl text-foreground outline-none focus:border-primary/50"
            />
          ) : (
            <h1 className="font-display text-4xl text-foreground">
              {view.title || "Untitled decision"}
            </h1>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  setDraft(null);
                }}
                className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="rounded-md bg-primary px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-foreground hover:border-foreground/40"
              >
                Edit
              </button>
              <button
                onClick={remove}
                className="rounded-md border border-border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground hover:border-destructive/40 hover:text-destructive"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BlueprintCard className="lg:col-span-2">
          <SectionLabel>Decision</SectionLabel>
          {editing ? (
            <textarea
              value={draft?.decision ?? ""}
              onChange={(e) =>
                setDraft((d) => (d ? { ...d, decision: e.target.value } : d))
              }
              rows={3}
              className="w-full resize-y rounded-md border border-border bg-background p-3 text-base text-foreground outline-none focus:border-primary/50"
            />
          ) : (
            <p className="text-lg leading-relaxed text-foreground">{view.decision}</p>
          )}

          <div className="mt-6">
            <SectionLabel>Expected outcome</SectionLabel>
            {editing ? (
              <textarea
                value={draft?.expected_outcome ?? ""}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, expected_outcome: e.target.value } : d))
                }
                rows={2}
                className="w-full resize-y rounded-md border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary/50"
              />
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {view.expected_outcome || "—"}
              </p>
            )}
          </div>

          <div className="mt-6">
            <SectionLabel>Alternatives considered</SectionLabel>
            <EditableList
              editing={editing}
              items={view.alternatives}
              onChange={(items) =>
                setDraft((d) => (d ? { ...d, alternatives: items } : d))
              }
            />
          </div>

          <div className="mt-6">
            <SectionLabel>Constraints</SectionLabel>
            <EditableList
              editing={editing}
              items={view.constraints}
              onChange={(items) => setDraft((d) => (d ? { ...d, constraints: items } : d))}
            />
          </div>
        </BlueprintCard>

        <div className="space-y-4">
          <BlueprintCard>
            <SectionLabel>Graph relations</SectionLabel>
            {view.relations.length === 0 ? (
              <p className="text-sm text-muted-foreground">None inferred.</p>
            ) : (
              <ul className="space-y-2">
                {view.relations.map((r, i) => (
                  <li key={i}>
                    <span className="mb-1 inline-block rounded bg-tag-blue px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-tag-blue-foreground">
                      {r.type}
                    </span>
                    <p className="text-sm text-foreground">{r.target}</p>
                  </li>
                ))}
              </ul>
            )}
          </BlueprintCard>

          <BlueprintCard>
            <SectionLabel>Source thread</SectionLabel>
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {view.raw_thread}
            </pre>
          </BlueprintCard>
        </div>
      </div>
    </Shell>
  );
}

function EditableList({
  editing,
  items,
  onChange,
}: {
  editing: boolean;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  if (!editing) {
    if (!items || items.length === 0)
      return <p className="text-sm text-muted-foreground">None recorded.</p>;
    return (
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={i}
            className="rounded border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-foreground"
          >
            {it}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={it}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary/50"
          />
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="rounded-md border border-border px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-destructive"
          >
            ×
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, ""])}
        className="rounded-md border border-dashed border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        + Add item
      </button>
    </div>
  );
}

// Normalize jsonb columns to typed arrays
function normalize(row: any): Thread {
  return {
    ...row,
    alternatives: Array.isArray(row.alternatives) ? row.alternatives : [],
    constraints: Array.isArray(row.constraints) ? row.constraints : [],
    relations: Array.isArray(row.relations) ? row.relations : [],
  };
}
