import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { BlueprintCard } from "@/components/Shell";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (search) => ({
    redirect: (search.redirect as string | undefined) ?? "/dashboard",
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: search.redirect || "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — Institutional Memory OS" },
      { name: "description", content: "Sign in to your decision graph." },
    ],
  }),
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Signed in");
    navigate({ to: search.redirect || "/dashboard" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setLoading(false);
      return;
    }
    if (result.redirected) return; // browser is redirecting
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your decision graph.">
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <Divider />

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
          />
        </Field>
        <Field label="Password">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary/50"
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link to="/signup" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="mb-8 block text-center">
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Institutional Memory OS
          </div>
          <div className="mt-1 font-display text-3xl text-foreground">
            imos<span className="text-primary">.</span>
          </div>
        </Link>
        <BlueprintCard>
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </BlueprintCard>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function Divider() {
  return (
    <div className="my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        or
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.4 2.4-6.9 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.7 39.2 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.5 4.4-4.6 5.7l6 4.9c-.4.4 6.7-4.9 6.7-14.6 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
