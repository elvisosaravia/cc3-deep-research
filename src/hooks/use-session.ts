import { useState, useEffect, useCallback } from "react";
import type { SessionSummary, Session } from "@/lib/sessions";

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      if (res.ok) {
        setSessions(await res.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = useCallback(
    async (id: string, topic: string) => {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, topic }),
      });
      setSessionId(id);
      await fetchSessions();
    },
    [fetchSessions]
  );

  const updateSession = useCallback(
    async (id: string, data: Partial<Session>) => {
      await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    []
  );

  const loadSession = useCallback(async (id: string): Promise<Session | null> => {
    try {
      const res = await fetch(`/api/sessions/${id}`);
      if (res.ok) {
        const session: Session = await res.json();
        setSessionId(id);
        return session;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (sessionId === id) setSessionId(null);
      await fetchSessions();
    },
    [sessionId, fetchSessions]
  );

  return {
    sessionId,
    setSessionId,
    sessions,
    createSession,
    updateSession,
    loadSession,
    removeSession,
    fetchSessions,
  };
}
