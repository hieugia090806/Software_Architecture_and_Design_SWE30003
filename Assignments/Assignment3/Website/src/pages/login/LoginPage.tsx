import { useNavigate } from "@tanstack/react-router";
import { Check, Eye, EyeOff, Info, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNTS, useAuth } from "@/lib/auth";
import type { Role } from "@/services/types";

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState(DEMO_ACCOUNTS[0]!.email);
  const [password, setPassword] = useState(DEMO_ACCOUNTS[0]!.password);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const account = DEMO_ACCOUNTS.find((a) => a.role === role)!;

  const pickRole = (next: Role) => {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === next)!;
    setRole(next);
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const landing = DEMO_ACCOUNTS.find((a) => a.role === result.user.role)!.landing;
    toast.success(`Signed in as ${result.user.name}`);
    navigate({ to: landing });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 grid-backdrop lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_45%_40%,oklch(0.76_0.17_163/12%),transparent_60%)]" />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Truck className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight">SmartFM</span>
            <span className="block text-[10px] tracking-[0.2em] text-muted-foreground">
              FLEET MANAGEMENT
            </span>
          </span>
        </div>

        <div className="relative max-w-lg">
          <p className="text-xs font-semibold tracking-[0.2em] text-accent">
            FLEET INTELLIGENCE PLATFORM
          </p>
          <h1 className="mt-5 text-6xl font-bold leading-[1.05]">
            Centralized
            <br />
            <span className="text-accent">Logistics &</span>
            <br />
            Fleet Control
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Real-time GPS telemetry, automated dispatch, freight pricing, and incident management
            across all hub networks.
          </p>
        </div>

        <div className="relative grid grid-cols-3 gap-4">
          {[
            { v: "48", l: "Active Vehicles" },
            { v: "847", l: "Trips Today" },
            { v: "99.8%", l: "Uptime" },
          ].map((s) => (
            <div key={s.l} className="panel px-5 py-4">
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Auth panel */}
      <section className="flex items-center justify-center bg-surface/40 px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-md">
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select your role and enter credentials</p>

          <p className="mt-8 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
            ACCESS ROLE
          </p>
          <div className="mt-3 space-y-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.role}
                type="button"
                onClick={() => pickRole(a.role)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                  role === a.role
                    ? "border-primary bg-primary/12"
                    : "border-border bg-surface hover:bg-surface-2"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${role === a.role ? "bg-primary" : "bg-muted-foreground/60"}`}
                />
                <span className="flex-1">
                  <span className="block text-sm font-semibold">{a.label}</span>
                  <span className="block text-xs text-muted-foreground">{a.subtitle}</span>
                </span>
                {role === a.role ? <Check className="size-4 text-accent" /> : null}
              </button>
            ))}
          </div>

          <label className="mt-6 block text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
            EMAIL
          </label>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            className="mt-2 h-12 bg-surface"
          />

          <label className="mt-4 block text-[11px] font-semibold tracking-[0.16em] text-muted-foreground">
            PASSWORD
          </label>
          <div className="relative mt-2">
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={show ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 bg-surface pr-11"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {error ? (
            <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="mt-6 h-12 w-full text-sm font-semibold">
            Sign In as {account.label.split(" / ")[0]}
          </Button>

          <div className="mt-6 rounded-xl border border-accent/30 bg-accent/8 p-4">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-accent">
              <Info className="size-3.5" /> DEMO CREDENTIALS
            </p>
            <div className="mt-3 space-y-1.5 font-mono text-[11px]">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.role}
                  type="button"
                  onClick={() => pickRole(a.role)}
                  className="flex w-full items-center justify-between gap-3 rounded px-1 py-0.5 hover:bg-secondary/60"
                >
                  <span className="capitalize text-muted-foreground">{a.role}</span>
                  <span>
                    {a.email} / {a.password}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Tap any row to auto-fill and switch role instantly.
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
