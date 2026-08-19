import { createD1DocumentDb, createMemoryDocumentDb, type DocumentDb } from "../content/d1";

export async function documentDbFromLocals(locals: unknown): Promise<DocumentDb> {
  const runtime = (locals as { runtime?: { env?: { DB?: Parameters<typeof createD1DocumentDb>[0] } } })
    ?.runtime;
  if (runtime?.env?.DB) return createD1DocumentDb(runtime.env.DB);

  const db = createMemoryDocumentDb();
  const extra = (process.env.ARIES_ALLOWLIST ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  for (const kerberos of extra) await db.addAllowlist(kerberos);
  return db;
}
