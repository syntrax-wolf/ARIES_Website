import type { ContentStore } from "./store";
import { loadJsonBackupStore } from "./store";

let buildStore: ContentStore | undefined;

/** Build-time reader: D1 when ARIES_CONTENT_SOURCE=d1, otherwise JSON backup. */
export async function loadBuildStore(): Promise<ContentStore> {
  if (buildStore) return buildStore;
  if (process.env.ARIES_CONTENT_SOURCE !== "d1") {
    buildStore = loadJsonBackupStore();
    return buildStore;
  }
  const { createD1DocumentDb, hydrateFromDocumentDb } = await import("./d1.ts");
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  try {
    const db = (proxy.env as { DB: Parameters<typeof createD1DocumentDb>[0] }).DB;
    buildStore = await hydrateFromDocumentDb(createD1DocumentDb(db));
    return buildStore;
  } finally {
    await proxy.dispose();
  }
}
