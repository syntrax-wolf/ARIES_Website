export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { publishProject } from "../../../lib/content/publish";
import { resolveActor } from "../../../lib/content/actor";
import { documentDbFromLocals } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";
import type { Project } from "../../../../../src/lib/types";

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

  const body = (await request.json().catch(() => ({}))) as {
    kind?: string;
    slug?: string;
    data?: Project;
  };

  if (body.kind !== "projects") {
    return Response.json({ error: "Invalid kind" }, { status: 400 });
  }
  const project = body.data;
  if (!project || typeof project !== "object") {
    return Response.json({ error: "Invalid data" }, { status: 400 });
  }
  const slug = String(project.slug || body.slug || "").trim();
  if (!SLUG_RE.test(slug)) {
    return Response.json({ error: "Invalid slug" }, { status: 400 });
  }

  const db = await documentDbFromLocals(locals);
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);
  const result = await publishProject(store, actor, { ...project, slug });
  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 403 });
  }
  return Response.json({ ok: true, mode: result.mode });
}
