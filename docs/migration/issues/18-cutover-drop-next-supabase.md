# 18 — Cut over: drop Next and Supabase

**What to build:** Production DNS points at the Astro Worker. Next.js, Supabase clients, and Sanity packages are gone. `AGENTS.md` file map matches the new tree.

**Blocked by:** 07, 12, 13, 14, 15, 16, 17

**Status:** done

## Acceptance criteria

- [x] Public URLs work on the Cloudflare hostname
- [x] Gate still Allowlist-only in production
- [x] No `@supabase/*` or `sanity` production dependencies
- [x] `content/*.json` remains a backup export from D1
- [x] README and AGENTS.md describe Astro + D1 + R2

## Verify

- Smoke: landing, one Project, one Event, one Profile, Resources, contact mailto
- Smoke: deny a non-Allowlist login; Admin password still works
- `npm ls` has no supabase/sanity
- `npm run build` is Astro-only

## Commit goal

`chore: cut over to Astro Workers; remove Next and Supabase`
