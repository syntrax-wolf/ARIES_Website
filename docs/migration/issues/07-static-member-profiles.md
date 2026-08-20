# 07 — Static member profiles

**What to build:** A visitor can open `/{slug}` and see Profile Blocks packed as today. Back-to-team / back-to-project still works from the query string.

**Blocked by:** 03, 05

**Status:** done

## Acceptance criteria

- [x] `/{slug}` prerenders from Member JSON
- [x] Unknown slug is 404; reserved routes (events, projects, …) still win
- [x] Profile Blocks render for each type we ship today
- [x] `?from=team` and `?from=project:{slug}` show the back control

## Verify

- Test: fixture Member with one text Block is retrievable; `admin` / `blogger` / Visitor are not on the public list
- Build and open a real Profile
- Check one full and one half Block

## Commit goal

`feat: prerender Member Profiles from JSON backup`
