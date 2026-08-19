export const prerender = false;

import { createWritableStore } from "../../../lib/content/d1";
import { resolveActor } from "../../../lib/content/actor";
import { addAllowlistKerberos, removeAllowlistKerberos } from "../../../lib/content/allowlist";
import { documentDbFromLocals } from "../../../lib/gate/runtime";
import { sessionFromRequest } from "../../../lib/gate/request";
import { canManageAllowlist } from "../../../../../src/lib/permissions";

async function ctx(request: Request, locals: unknown) {
  const session = sessionFromRequest(request);
  if (!session) return null;
  const db = await documentDbFromLocals(locals);
  const store = createWritableStore(db);
  const actor = await resolveActor(store, session);
  return { store, actor };
}

export async function GET({ request, locals }: { request: Request; locals: unknown }) {
  const c = await ctx(request, locals);
  if (!c) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (c.actor.session.kind !== "admin" && !canManageAllowlist(c.actor.level)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json({ allowlist: await c.store.listAllowlist() });
}

export async function POST({ request, locals }: { request: Request; locals: unknown }) {
  const c = await ctx(request, locals);
  if (!c) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    kerberos?: string;
  };
  const result =
    body.action === "remove"
      ? await removeAllowlistKerberos(c.store, c.actor, String(body.kerberos ?? ""))
      : await addAllowlistKerberos(c.store, c.actor, String(body.kerberos ?? ""));
  if (!result.ok) return Response.json({ error: result.error }, { status: 403 });
  return Response.json({ ok: true, allowlist: await c.store.listAllowlist() });
}
