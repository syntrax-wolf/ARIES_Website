export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { resolveActor } from "../../../lib/content/actor";
import { getDocumentDb } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";
import { planUpload } from "../../../lib/media/upload";
import { memoryMedia } from "../../../lib/media/memory";
import { workerEnv, runtimeVar } from "../../../lib/cloudflare-env";

const publicBase = () => (runtimeVar("MEDIA_PUBLIC_BASE") || "/media").replace(/\/$/, "");

export async function POST({
  request,
}: {
  request: Request;
}) {
  const session = sessionFromRequest(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDocumentDb();
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);

  const form = await request.formData();
  const kind = String(form.get("kind") ?? "misc");
  const file = form.get("file");
  const small = form.get("small");
  const large = form.get("large");

  const named = file instanceof File ? file : small instanceof File ? small : large instanceof File ? large : null;
  if (!named) return Response.json({ error: "file required" }, { status: 400 });

  const plan = planUpload({
    filename: named.name || "upload.jpg",
    size: named.size,
    kind,
    level: actor.level,
  });
  if (!plan.ok) return Response.json({ error: plan.error }, { status: 400 });

  const r2 = workerEnv().MEDIA ?? null;
  const put = async (key: string, blob: File, contentType: string) => {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (r2) {
      await r2.put(key, bytes, { httpMetadata: { contentType } });
    } else {
      memoryMedia.set(key, bytes);
    }
  };

  if (plan.kind === "image") {
    const smallFile = small instanceof File ? small : named;
    const largeFile = large instanceof File ? large : named;
    if (plan.keys.small) await put(plan.keys.small, smallFile, "image/webp");
    if (plan.keys.large) await put(plan.keys.large, largeFile, "image/webp");
    const url = `${publicBase()}/${plan.keys.large ?? plan.keys.small}`;
    return Response.json({
      ok: true,
      url,
      srcset: plan.keys.small && plan.keys.large
        ? `${publicBase()}/${plan.keys.small} 400w, ${publicBase()}/${plan.keys.large} 1200w`
        : undefined,
      keys: plan.keys,
      type: "image",
    });
  }

  if (plan.keys.original) await put(plan.keys.original, named, named.type || "video/mp4");
  return Response.json({
    ok: true,
    url: `${publicBase()}/${plan.keys.original}`,
    keys: plan.keys,
    type: "video",
  });
}

