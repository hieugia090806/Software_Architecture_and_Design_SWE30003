import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import type { Role } from "@/services/types";

/** Client-side role gate: bounces anyone without the required role to login. */
export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && (!user || user.role !== role)) {
      navigate({ to: "/", replace: true });
    }
  }, [ready, user, role, navigate]);

  if (!ready || !user || user.role !== role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }
  return <>{children}</>;
}
