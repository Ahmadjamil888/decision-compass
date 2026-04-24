import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "./login";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Create your graph — imos" },
      { name: "description", content: "Create your institutional memory graph." },
    ],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { display_name: displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Identity established. Welcome to IMOS.");
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard",
      },
    });
    if (error) {
      toast.error(error.message ?? "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create your graph" subtitle="Establish your institutional memory nodes.">
      <div className="space-y-6">
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-border/60 bg-card/40 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-foreground transition-all duration-300 hover:border-foreground/30 hover:bg-card/60 active:scale-[0.98]"
        >
          <GoogleIcon />
          <span>Initialize with Google</span>
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">Legacy registration</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Satoshi Nakamoto"
              className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:border-primary/40 focus:bg-card/60"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:border-primary/40 focus:bg-card/60"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:border-primary/40 focus:bg-card/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-full bg-foreground px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-background transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span className="relative z-10">{loading ? "Establishing identity…" : "Create identity"}</span>
          </button>
        </form>

        <p className="text-center font-mono text-[11px] text-muted-foreground/60">
          Already part of the graph?{" "}
          <Link to="/login" className="text-foreground underline decoration-border/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary/40">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.5 29 4.5 24 4.5 16.4 4.5 9.8 8.7 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.5-1.9 12.9-5l-6-4.9c-2 1.4-4.4 2.4-6.9 2.4-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.7 39.2 16.3 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.5 4.4-4.6 5.7l6 4.9c-.4.4 6.7-4.9 6.7-14.6 0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
