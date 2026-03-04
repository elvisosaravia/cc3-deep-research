"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Trash2,
  FileText,
} from "lucide-react";
import type { SessionSummary } from "@/lib/sessions";

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface SidebarProps {
  sessions: SessionSummary[];
  activeSessionId: string | null;
  onSessionClick: (id: string) => void;
  onNewResearch: () => void;
  onDeleteSession: (id: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSessionClick,
  onNewResearch,
  onDeleteSession,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <aside
      className={`fixed left-0 top-0 z-30 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-2">
        {!collapsed && (
          <span className="truncate text-sm font-medium">History</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* New Research button */}
      <div className="p-2">
        <Button
          variant="ghost"
          className={`w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent ${
            collapsed ? "px-2" : ""
          }`}
          onClick={onNewResearch}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-sm">New Research</span>}
        </Button>
      </div>

      {/* Session list */}
      {!collapsed && (
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 pb-4">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`group flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent ${
                  activeSessionId === s.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : ""
                }`}
                onClick={() => onSessionClick(s.id)}
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.topic}</p>
                  <p className="text-xs text-muted-foreground">
                    {relativeTime(s.updatedAt)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(s.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                No research sessions yet
              </p>
            )}
          </div>
        </ScrollArea>
      )}
    </aside>
  );
}
