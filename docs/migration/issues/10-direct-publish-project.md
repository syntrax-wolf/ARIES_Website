# 10 — Direct-publish a Project

**What to build:** An Allowlisted Leadership (or Listed Coordinator) can edit a Project in the editor and see it on the next public build. Executives still cannot skip the queue (that is ticket 12).

**Blocked by:** 01, 08, 09

**Status:** done

**Seams:** Permissions + Content store.

## Acceptance criteria

- [x] Editor lists Projects for a Session that may edit them
- [x] Direct publish upserts the Project in D1
- [x] Change Log records the publish
- [x] Public reader returns the new tagline
- [x] A Session that must not direct-publish is refused

## Verify

- Tests: Leadership save then getProject; Coordinator not Listed is refused
- Manual: log in as Admin, change a Project name, rebuild or dev preview, open the public page
- One Project form island, not a new editor design

## Commit goal

`feat: Leadership can direct-publish Projects to D1`
