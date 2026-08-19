# Docs

Code is the source of truth. These files are only orientation.

| Read this | When |
| --- | --- |
| [CONTEXT.md](../CONTEXT.md) | You need the club’s words (Member, Gate, Allowlist, …) |
| [adr/](adr/) | You need *why* a hard choice was made |
| [migration/spec.md](migration/spec.md) | You are implementing the Astro + Cloudflare rewrite |
| [migration/issues/](migration/issues/) | You are picking the next vertical slice |
| [AGENTS.md](../AGENTS.md) | You need the file map |

## For humans

The public site needs no login. The editor is behind the Gate: IIT Delhi (DevClub) only if your Kerberos is on the Allowlist, or the single Admin password. Club Level still decides what you can publish once you are in.

Production is Astro on Cloudflare Workers (D1 + R2). Do not change DNS unless a human asks.

## For agents

1. Read `CONTEXT.md`. Use those terms. Do not invent synonyms.
2. Read ADRs that touch your ticket.
3. Take the lowest-numbered ticket in `docs/migration/issues/` whose blockers are done.
4. TDD at the seams named in the spec ([agents/tdd.md](agents/tdd.md)). Do not test internals.
5. Match that ticket’s **Verify** and **Commit goal**. Do not start the next ticket in the same commit.

Tracker conventions: [agents/issue-tracker.md](agents/issue-tracker.md).
