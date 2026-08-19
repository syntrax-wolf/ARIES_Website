export type RebuildResult = { ok: true; skipped?: boolean } | { ok: false; error: string };

/** POST the documented hook after a successful D1 write. Missing URL is a no-op. */
export async function triggerRebuild(
  hookUrl: string | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RebuildResult> {
  const url = hookUrl?.trim();
  if (!url) return { ok: true, skipped: true };
  try {
    const res = await fetchImpl(url, { method: "POST" });
    if (!res.ok) return { ok: false, error: `Rebuild hook returned ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Rebuild hook failed" };
  }
}
