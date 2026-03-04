import { NextResponse } from "next/server";
import { listSessions, saveSession } from "@/lib/session-storage";
import type { Session } from "@/lib/sessions";

export async function GET() {
  const sessions = await listSessions();
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, topic } = body as { id: string; topic: string };

  if (!id || !topic) {
    return NextResponse.json(
      { error: "id and topic are required" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const session: Session = {
    id,
    topic,
    createdAt: now,
    updatedAt: now,
    status: "in-progress",
    messages: [],
  };

  await saveSession(session);
  return NextResponse.json(session, { status: 201 });
}
