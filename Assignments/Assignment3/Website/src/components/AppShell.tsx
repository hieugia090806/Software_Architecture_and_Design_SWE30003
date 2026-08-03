import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { LogOut, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  value: string;
}

interface AppShellProps {
  title: string;
  subtitle: string;
  nav: NavItem[];
  active: string;
  onNavigate: (value: string) => void;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  title,
  subtitle,
  nav,
  active,
  onNavigate,
  headerRight,
  children,
}: AppShellProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Link to="/" className="flex items-center gap-3 px-5 py-5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Truck className="size-5" />
          </span>
          <span>
            <span className="block text-base font-bold leading-tight">SmartFM</span>
            <span className="block text-[10px] tracking-[0.18em] text-muted-foreground">
              FLEET MANAGEMENT
            </span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.value;
            return (
              <button
                key={item.value}
                onClick={() => onNavigate(item.value)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className={`size-4 ${isActive ? "text-accent" : ""}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/85 px-5 py-4 backdrop-blur">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-bold">{title}</h1>
              <Badge variant="outline" className="border-accent/40 text-accent">
                {user?.role.toUpperCase()}
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {headerRight}
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 lg:hidden">
          {nav.map((item) => (
            <button
              key={item.value}
              onClick={() => onNavigate(item.value)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs ${
                active === item.value
                  ? "bg-sidebar-accent font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main key={pathname} className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
