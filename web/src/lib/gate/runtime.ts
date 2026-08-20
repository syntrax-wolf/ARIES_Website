import { createD1DocumentDb, createMemoryDocumentDb, type DocumentDb } from "../content/d1";
import { runtimeVar, workerEnv } from "../cloudflare-env";

export async function getDocumentDb(): Promise<DocumentDb> {
  const db = workerEnv().DB;
  if (db) return createD1DocumentDb(db as Parameters<typeof createD1DocumentDb>[0]);

  const memory = createMemoryDocumentDb();
  const extra = runtimeVar("ARIES_ALLOWLIST")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  for (const kerberos of extra) await memory.addAllowlist(kerberos);
  return memory;
}
