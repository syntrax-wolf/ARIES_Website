# Stay on Cloudflare Workers Free

ARIES is a campus club site. Paid Workers is unnecessary if public HTML is static (does not count as Worker requests), Sessions are signed cookies (not KV writes), Media is R2, and we never call Cloudflare Images or EmDash Dynamic Workers. The 10 ms CPU cap means no image codecs in the Worker. If we SSR the public site, we will blow the 100k requests/day cap and have to pay.
