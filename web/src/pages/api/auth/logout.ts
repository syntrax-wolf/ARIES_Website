export const prerender = false;

import { clearSessionCookieHeader, cookieIsSecure } from "../../../lib/gate/gate";

export function POST({ request }: { request: Request }) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/admin", request.url).toString(),
      "Set-Cookie": clearSessionCookieHeader(cookieIsSecure(request.url)),
    },
  });
}
