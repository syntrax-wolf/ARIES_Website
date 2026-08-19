export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { resolveActor } from "../../../lib/content/actor";
import { ensureVisitor } from "../../../lib/content/roster";
import { documentDbFromLocals } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";

const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

export async function POST({
  request,
  locals,
}: {
  request: Request;
  locals: unknown;
}) {
  const session = sessionFromRequest(request);
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
  const name = String(body.name ?? "").trim();
  const slug =
    String(body.slug ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!name) return Response.json({ error: "Name is required" }, { status: 400 });
  if (!SLUG_RE.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });

  const db = await documentDbFromLocals(locals);
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);
  const result = await ensureVisitor(store, actor, { slug, name });
  if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
  return Response.json({ ok: true, slug: result.slug, name, level: "visitor" });
}
