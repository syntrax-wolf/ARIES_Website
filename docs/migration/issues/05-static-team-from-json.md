# 05 — Static team from JSON backup

**What to build:** A visitor can see Team Years, group photos, coordinators, executives, and Alumni from JSON.

**Blocked by:** 03

**Status:** done

## Acceptance criteria

- [x] `/team` shows the current Team Year structure from `content/team.json`
- [x] Alumni section renders
- [x] Links to Member Profiles use the same slugs as today

## Verify

- Test: fixture Team Year with one core Member is returned by the reader
- Build and open `/team`
- Spot-check one photo and one Profile link

## Commit goal

`feat: prerender Team and Alumni from JSON backup`
