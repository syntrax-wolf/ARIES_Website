# 06 — Static resources and contact

**What to build:** A visitor can browse Resources from JSON and use the contact mailto form. Sanity is not required for this slice (Sanity posts come later).

**Blocked by:** 03

**Status:** done

## Acceptance criteria

- [x] `/resources` lists JSON Resources
- [x] `/resources/{slug}` shows body when present
- [x] `/contact` still opens mail to the club address

## Verify

- Test: fixture Resource is retrievable by slug
- Build and open list, detail, contact
- Submit contact — mailto target is the club email

## Commit goal

`feat: prerender Resources and Contact from JSON backup`
