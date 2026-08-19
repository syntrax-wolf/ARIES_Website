export const prerender = false;

import {
  decideAdminGate,
  mintSessionCookie,
  sessionCookieHeader,
} from "../../../lib/gate/gate";

export async function POST({ request }: { request: Request }) {
  const body = (await request.json().catch(() => ({}))) as {
    entryNumber?: string;
    email?: string;
    password?: string;
  };
  const identifier = String(body.entryNumber || body.email || "").trim();
  const password = String(body.password || "");
  const secret = process.env.ADMIN_PASSWORD ?? "";
  const signing = process.env.SESSION_SECRET ?? secret;
  const decision = decideAdminGate(identifier, password, secret);

  if (!decision.ok) {
    return Response.json({ error: decision.error }, { status: 401 });
  }
  if (!signing) {
    return Response.json({ error: "SESSION_SECRET is not configured" }, { status: 503 });
  }

  const cookie = mintSessionCookie(decision.session, signing);
  return new Response(JSON.stringify({ kind: "admin" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": sessionCookieHeader(cookie),
    },
  });
}
