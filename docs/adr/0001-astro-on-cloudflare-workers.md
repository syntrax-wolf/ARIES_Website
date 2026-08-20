# Astro on Cloudflare Workers, not Next.js

The public site is almost all cacheable club content. Next.js runs session work on every request, which fights a free, static edge. We rewrite public pages to Astro, prerender them, and keep the existing React editor as islands. Cloudflare Workers (not Pages) is the host so the adapter, D1, and R2 bindings stay in one deploy.

**Considered:** keep Next via OpenNext; EmDash (Astro CMS). OpenNext still SSR-habits the public site. EmDash cannot express the Gate, Allowlist, or Level matrix without paid plugin isolates.
