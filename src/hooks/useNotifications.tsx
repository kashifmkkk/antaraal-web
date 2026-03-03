import { useEffect, useRef } from "react";
import { apiUrl, fetchJson } from "@/lib/api";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

export type NotificationPayload = {
  id: string;
  title: string;
  body?: string;
  level?: "info" | "warning" | "error";
  createdAt?: string;
};

export function useNotifications() {
  const { token } = useAdminAuth();
  const { toast } = useToast();
  const sinceRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    let es: EventSource | null = null;
    let pollTimer: any;
    const startSSE = () => {
      try {
        const url = apiUrl(`/api/admin/notifications/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`);
        es = new EventSource(url);
        es.onmessage = (ev) => {
          try {
            const payload: NotificationPayload = JSON.parse(ev.data);
            sinceRef.current = payload.createdAt ?? new Date().toISOString();
            toast({ title: payload.title, description: payload.body, variant: payload.level === 'error' ? 'destructive' : undefined });
          } catch (err) {
            // ignore parse error
          }
        };
        es.onerror = () => {
          // close and fallback to polling
          try { es?.close(); } catch {};
          es = null;
          startPolling();
        };
      } catch (err) {
        startPolling();
      }
    };

    const startPolling = () => {
      const poll = async () => {
        try {
          const q = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : "";
          const res = await fetch(apiUrl(`/api/admin/notifications${q}`), {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          if (!res.ok) return;
          const list: NotificationPayload[] = await res.json();
          for (const p of list) {
            sinceRef.current = p.createdAt ?? sinceRef.current;
            toast({ title: p.title, description: p.body, variant: p.level === 'error' ? 'destructive' : undefined });
          }
        } catch (err) {
          // ignore
        } finally {
          pollTimer = setTimeout(poll, 15000);
        }
      };
      poll();
    };

    // try SSE first
    startSSE();

    return () => {
      try { es?.close(); } catch {}
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [token, toast]);
}
