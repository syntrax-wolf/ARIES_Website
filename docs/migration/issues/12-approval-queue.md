# 12 — Change Request queue

**What to build:** An Executive Listed on a Project gets a pending Change Request instead of a live edit. Leadership (and Listed Coordinators who are reviewers) can approve or reject. Approve applies the payload; the request is gone. Join requests append a Contributor.

**Blocked by:** 10

**Status:** done

**Seam:** Content store (enqueue + apply) and Permissions.

## Acceptance criteria

- [x] Executive Listed save creates a pending Change Request, not a live Project
- [x] Approve writes the payload and deletes the request
- [x] Reject deletes the request and leaves the Project unchanged
- [x] Join-request approve adds the Member as Contributor
- [x] The unused second review RPC is not part of this path

## Verify

- Tests: enqueue → public still old; approve → public new; reject → public old; join adds slug
- Manual: two Sessions (Executive + Leadership) on `/admin/editor` approvals and `/account` inbox if that island is ported

## Commit goal

`feat: Executive Change Requests with approve/reject`
