# 03 — Static projects from JSON backup

**What to build:** A visitor can browse and open Projects using `content/` JSON at build time. Search/filter still works as an island. No Supabase.

**Blocked by:** 02

**Status:** done

**Seam:** Content store (read-only, in-memory or JSON adapter). TDD: given a known Project slug from a fixture, the public reader returns that name and tagline.

## Acceptance criteria

- [x] `/projects` lists Projects from the JSON backup
- [x] `/projects/{slug}` shows one Project
- [x] Explorer search/filter still behaves as today
- [x] Unknown slug is a 404

## Verify

- Test: fixture with one Project is retrievable by slug and missing slug is empty
- Build prerenders at least one real Project from `content/projects`
- Click through list → detail locally

## Commit goal

`feat: prerender Projects from JSON backup`
