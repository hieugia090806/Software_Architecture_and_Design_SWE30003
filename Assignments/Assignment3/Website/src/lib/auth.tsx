import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Role, User } from "@/services/types";
import { users } from "@/services/mockData";

const STORAGE_KEY = "smartfm.session";

export interface DemoAccount {
  role: Role;
  label: string;
  subtitle: string;
  email: string;
  password: string;
  landing: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "admin",
    label: "Admin / Dispatcher",
    subtitle: "Fleet control, telemetry & trip allocation",
    email: "admin@smartfm.com",
    password: "admin123",
    landing: "/admin",
  },
  {
    role: "staff",
    label: "Staff / Driver",
    subtitle: "Trip execution workspace & incident logging",
    email: "staff@smartfm.com",
    password: "staff123",
    landing: "/staff",
  },
  {
    role: "customer",
    label: "Customer / Client",
    subtitle: "Order tracking, freight quotes & invoices",
    email: "customer@smartfm.com",
    password: "customer123",
    landing: "/customer",
  },
];

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => { ok: true; user: User } | { ok: false; error: string };
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      /* ignore corrupted session */
    }
    setReady(true);
  }, []);

  const signIn = useCallback((email: string, password: string) => {
    const account = DEMO_ACCOUNTS.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password,
    );
    if (!account) return { ok: false as const, error: "Invalid email or password for this role." };
    const record = users.find((u) => u.email === account.email);
    if (!record) return { ok: false as const, error: "No user profile linked to this account." };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    setUser(record);
    return { ok: true as const, user: record };
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, signIn, signOut }), [user, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const landingFor = (role: Role) =>
  DEMO_ACCOUNTS.find((a) => a.role === role)?.landing ?? "/";
