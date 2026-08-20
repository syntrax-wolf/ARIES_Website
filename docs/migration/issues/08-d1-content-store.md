# 08 — D1 content store and seed

**What to build:** The same public reader can load from D1 after a seed from `content/*.json`. A local wrangler/D1 build of Projects still prerenders.

**Blocked by:** 03

**Status:** done

**Seam:** Content store (TDD). Read and write through the public store, not SQL in tests.

## Acceptance criteria

- [x] Seed script loads Members, Projects, Events, Resources, Team into D1
- [x] Public reader used at build can use D1 (local) instead of only JSON
- [x] Allowlist table exists (may be empty)
- [x] Round-trip: save a Project, read it back with the same name

## Verify

- Tests: seed fixture → getProject; update → getProject shows new tagline
- `wrangler d1` local seed then `astro build` still emits a known Project page
- No Supabase client in the new store

## Commit goal

`feat: D1 content store seeded from JSON backup`
