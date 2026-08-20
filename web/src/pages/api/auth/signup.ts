export const prerender = false;

import { decideSignup } from "../../../lib/gate/gate";

export function POST() {
  const decision = decideSignup();
  return Response.json({ error: decision.error }, { status: 410 });
}
