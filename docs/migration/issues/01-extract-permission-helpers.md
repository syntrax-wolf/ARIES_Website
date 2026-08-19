# 01 — Extract permission helpers

**What to build:** Club Level and Listed rules can be decided in tests with no web framework. Same answers as today: who publishes, who queues, who approves, who may touch the Roster.

**Blocked by:** None (can start immediately).

**Status:** done

**Seam:** Permissions (TDD).

## Acceptance criteria

- [x] Given Leadership, they may direct-publish any Project or Event
- [x] Given a Coordinator, they may direct-publish only when Listed
- [x] Given an Executive, they may only enqueue a Change Request, and only when Listed
- [x] Given a Blogger, they may publish a Resource and not a Project
- [x] Given Leadership, they may manage the Roster and Allowlist; others may not
- [x] Helpers import nothing from Next or Supabase

## Verify

- Tests at the Permissions seam: red then green per behaviour above
- Existing editor still compiles (re-export from old import paths if needed)

## Commit goal

`test: extract Level and Listed rules as a framework-free seam`
