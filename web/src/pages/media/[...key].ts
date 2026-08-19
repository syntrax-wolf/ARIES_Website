export const prerender = false;

import { memoryMedia } from "../../lib/media/memory";

type R2Object = { body: ReadableStream; httpMetadata?: { contentType?: string } };
type R2Like = { get(key: string): Promise<R2Object | null> };

export async function GET({
  params,
  locals,
}: {
  params: { key?: string };
  locals: unknown;
}) {
  const key = String(params.key ?? "").replace(/^\/+/, "");
  if (!key) return new Response("Not found", { status: 404 });

  const runtime = (locals as { runtime?: { env?: { MEDIA?: R2Like } } })?.runtime;
  const r2 = runtime?.env?.MEDIA;
  if (r2) {
    const obj = await r2.get(key);
    if (!obj) return new Response("Not found", { status: 404 });
    return new Response(obj.body, {
      headers: {
        "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const bytes = memoryMedia.get(key);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(bytes, {
    headers: { "Content-Type": "application/octet-stream" },
  });
}
