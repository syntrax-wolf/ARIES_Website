# Docs

Code is the source of truth. These files are only orientation.

| Read this | When |
| --- | --- |
| [CONTEXT.md](../CONTEXT.md) | You need the club’s words (Member, Gate, Allowlist, …) |
| [../README.md](../README.md) | You need the live layout and how to run the app |
| [../AGENTS.md](../AGENTS.md) | You need the file-to-change map |
| [adr/](adr/) | You need *why* a hard choice was made |
| [migration/](migration/) | You need the completed rewrite spec and tickets (archive) |

## For humans

The public site needs no login. The editor is behind the Gate: IIT Delhi (DevClub) only if your Kerberos is on the Allowlist, or the single Admin password. Club Level still decides what you can publish once you are in.

The live app is Astro on Cloudflare Workers (D1 + R2) in `web/`. Do not change DNS unless a human asks.

## For agents

1. Read `CONTEXT.md`. Use those terms. Do not invent synonyms.
2. Read ADRs that touch the area you are changing.
3. Edit `web/`. Do not revive Next, Supabase, or Studio.
4. TDD at the seams in `docs/migration/spec.md` ([agents/tdd.md](agents/tdd.md)): Permissions, Gate, Content store, Upload policy.
5. The rewrite tickets in `docs/migration/issues/` are **done** (01–18). Do not reopen them unless a human asks.
