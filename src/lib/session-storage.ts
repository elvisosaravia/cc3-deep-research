import { promises as fs } from "fs";
import path from "path";
import type { Session, SessionSummary } from "./sessions";

const SESSIONS_DIR = path.join(process.cwd(), "data", "sessions");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateId(id: string): boolean {
  return UUID_RE.test(id);
}

function sessionPath(id: string): string {
  return path.join(SESSIONS_DIR, `${id}.json`);
}

async function ensureDir() {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

export async function listSessions(): Promise<SessionSummary[]> {
  await ensureDir();
  let files: string[];
  try {
    files = await fs.readdir(SESSIONS_DIR);
  } catch {
    return [];
  }

  const summaries: SessionSummary[] = [];
  for (const file of files) {
    if (!file.endsWith(".json")) continue;
    try {
      const raw = await fs.readFile(path.join(SESSIONS_DIR, file), "utf-8");
      const session: Session = JSON.parse(raw);
      summaries.push({
        id: session.id,
        topic: session.topic,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: session.status,
      });
    } catch {
      // skip corrupt files
    }
  }

  summaries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  return summaries;
}

export async function getSession(id: string): Promise<Session | null> {
  if (!validateId(id)) return null;
  try {
    const raw = await fs.readFile(sessionPath(id), "utf-8");
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function saveSession(session: Session): Promise<void> {
  if (!validateId(session.id)) throw new Error("Invalid session ID");
  await ensureDir();
  await fs.writeFile(sessionPath(session.id), JSON.stringify(session), "utf-8");
}

export async function deleteSession(id: string): Promise<boolean> {
  if (!validateId(id)) return false;
  try {
    await fs.unlink(sessionPath(id));
    return true;
  } catch {
    return false;
  }
}
