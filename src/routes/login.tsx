import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "@/components/Shell";

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
      { title: "Sign in — imos" },
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
    <AuthLayout title="Welcome back" subtitle="Sign in to access your decision graph.">
      <div className="space-y-6">
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="group relative flex w-full items-center justify-center gap-3 rounded-full border border-border/60 bg-card/40 px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-foreground transition-all duration-300 hover:border-foreground/30 hover:bg-card/60 active:scale-[0.98]"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <div className="flex items-center gap-4 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground/60">Secure authentication</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/60 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div className="flex items-center justify-between">
              <label className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">Password</label>
              <button type="button" className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50 hover:text-primary">Forgot?</button>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border/60 bg-card/40 px-4 py-3.5 font-mono text-sm text-foreground outline-none transition-all duration-300 placeholder:text-muted-foreground/30 focus:border-primary/40 focus:bg-card/60"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-full bg-foreground px-5 py-4 font-mono text-[11px] uppercase tracking-wider text-background transition-all duration-300 hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            <span className="relative z-10">{loading ? "Synchronizing…" : "Enter workspace"}</span>
          </button>
        </form>

        <p className="text-center font-mono text-[11px] text-muted-foreground/60">
          First time here?{" "}
          <Link to="/signup" className="text-foreground underline decoration-border/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary/40">
            Create an identity
          </Link>
        </p>
      </div>
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
    <div className="min-h-screen bg-grid flex flex-col items-center justify-center p-6">
      <Reveal>
        <Link to="/" className="mb-12 block text-center group">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60 transition-colors group-hover:text-primary">
            Institutional Memory OS
          </div>
          <div className="mt-2 font-display text-5xl text-foreground tracking-tighter">
            imos<span className="text-primary group-hover:animate-pulse">.</span>
          </div>
        </Link>
      </Reveal>

      <Reveal delay={100} className="w-full max-w-md">
        <div className="relative rounded-[2.5rem] border border-border/40 bg-card/20 p-2 backdrop-blur-3xl">
          <div className="relative rounded-[calc(2.5rem-0.5rem)] border border-white/[0.05] bg-card/80 p-8 md:p-10">
            <h1 className="font-display text-4xl tracking-tight text-foreground">{title}</h1>
            <p className="mb-8 mt-2 text-sm leading-relaxed text-muted-foreground/70">{subtitle}</p>
            {children}
          </div>
        </div>
      </Reveal>
      
      <Reveal delay={300} className="mt-12 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
          Protected by end-to-end encryption · imos v1.0.4
        </p>
      </Reveal>
    </div>
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
