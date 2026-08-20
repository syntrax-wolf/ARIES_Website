# Issue tracker: local markdown

Issues and specs live in `docs/migration/` (committed, so agents and humans share them).

## Conventions

- Spec: `docs/migration/spec.md`
- One ticket per file: `docs/migration/issues/NN-slug.md`, numbered from `01`, blockers first
- `Status:` near the top uses `ready-for-agent`, `claimed`, `done`
- `Blocked by:` lists ticket numbers, or `None`
- A ticket is unblocked when every listed blocker has `Status: done`
- Frontier: lowest number that is `ready-for-agent` and unblocked
- Claim: set `Status: claimed` before work
- Finish: tick acceptance criteria, set `Status: done`, commit using the ticket’s **Commit goal**

Do not open GitHub issues for these tickets unless a human asks.

Tickets **01–18 are done**. This tracker is the rewrite archive; do not file a 19 unless a human asks.
