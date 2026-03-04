import type { UIMessage } from "ai";

export interface Session {
  id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  status: "in-progress" | "completed";
  messages: UIMessage[];
}

export interface SessionSummary {
  id: string;
  topic: string;
  createdAt: string;
  updatedAt: string;
  status: "in-progress" | "completed";
}
