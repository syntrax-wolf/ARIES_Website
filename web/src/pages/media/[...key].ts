export const prerender = false;

import { memoryMedia } from "../../lib/media/memory";
import { workerEnv } from "../../lib/cloudflare-env";

export async function GET({
  params,
}: {
  params: { key?: string };
}) {
  const key = String(params.key ?? "").replace(/^\/+/, "");
  if (!key) return new Response("Not found", { status: 404 });

  const r2 = workerEnv().MEDIA;
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
