"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { UserProfile } from "@/lib/auth-types";

type AuthContextValue = {
  user: UserProfile | null;
  loading: boolean;
  authenticate: (data: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const authEventKey = "si-tutor:auth-change";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const version = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++version.current;
    try {
      const response = await fetch("/api/auth", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      if (version.current === current) setUser(result.user);
    } finally {
      if (version.current === current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => { void refresh().catch(() => undefined); };
    const onStorage = (event: StorageEvent) => { if (event.key === authEventKey || event.key === null) sync(); };
    sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", sync);
    };
  }, [refresh]);

  async function update(method: "POST" | "DELETE", data?: Record<string, unknown>) {
    const response = await fetch("/api/auth", {
      method, headers: { "Content-Type": "application/json" },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Something went wrong. Please try again.");
    version.current++;
    setUser(result.user);
    setLoading(false);
    try { localStorage.setItem(authEventKey, `${Date.now()}-${Math.random()}`); } catch { /* Cookie sessions also work without local storage. */ }
  }

  return <AuthContext.Provider value={{ user, loading, authenticate: (data) => update("POST", data), logout: () => update("DELETE") }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
