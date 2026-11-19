"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { permissions, type AdminState } from "@/lib/admin-types";

type Ctx = {
  state: AdminState | null;
  error: string;
  loading: boolean;
  /** Run an admin action; shows a toast and refreshes all data. Returns false on failure. */
  act: (type: string, payload?: Record<string, unknown>, success?: string) => Promise<boolean>;
  upload: (file: File) => Promise<{ url: string; name: string } | null>;
  can: (area: "catalog" | "sales" | "team") => boolean;
  refresh: () => Promise<void>;
};

const AdminContext = createContext<Ctx | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminState | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/state", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not load admin data.");
      setState(result);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch once on mount; state updates happen after the request resolves.
    const timer = setTimeout(() => { void refresh(); }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  const act = useCallback<Ctx["act"]>(async (type, payload = {}, success = "Saved") => {
    try {
      const response = await fetch("/api/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...payload }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save the change.");
      setState(result.state);
      toast.success(success);
      return true;
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not save the change.");
      return false;
    }
  }, []);

  const upload = useCallback<Ctx["upload"]>(async (file) => {
    const body = new FormData();
    body.append("file", file);
    const id = toast.loading(`Uploading ${file.name}…`);
    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Upload failed.");
      toast.success("Uploaded", { id });
      return { url: result.url as string, name: result.name as string };
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Upload failed.", { id });
      return null;
    }
  }, []);

  const can = useCallback<Ctx["can"]>((area) => {
    const role = state?.me.adminRole ?? "support";
    return permissions[role][area];
  }, [state]);

  return <AdminContext.Provider value={{ state, error, loading, act, upload, can, refresh }}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminProvider");
  return context;
}
