# 02 — Astro static landing

**What to build:** A visitor opening `/` on a local Astro + Cloudflare build sees the current landing (nav, hero, sections, footer). Chrome images are optimized at build. No Session code runs on that page.

**Blocked by:** None (can start immediately).

**Status:** done

## Acceptance criteria

- [x] `astro build` emits `/` as a static file
- [x] Landing matches the current public sections (nav, hero, what we do, FAQ/footer)
- [x] Image service is compile at build and passthrough at runtime (no Images product)
- [x] Worker is not required to view `/` in preview of static assets

## Verify

- `npm run build` succeeds
- Open the built `/` — no login cookie required
- Built Chrome files are hashed WebP/AVIF (or equivalent), not raw PNG where we used `<Image>`
- Confirm wrangler/adapter targets Workers, not Pages

## Commit goal

`feat: Astro Cloudflare shell with static landing`
