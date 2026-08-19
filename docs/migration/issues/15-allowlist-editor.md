# 15 — Allowlist editor

**What to build:** Leadership can add and remove Kerberos ids on the Allowlist from the editor. Changes take effect at the next login (no Session for removed people).

**Blocked by:** 09

**Status:** done

**Seams:** Gate + Permissions.

## Acceptance criteria

- [x] Only Leadership can change the Allowlist
- [x] Added Kerberos can pass the Gate
- [x] Removed Kerberos is refused on the next login
- [x] Empty Allowlist means only Admin password works

## Verify

- Tests: add then Gate allows; remove then Gate denies; Coordinator cannot write Allowlist
- Manual: add your Kerberos, DevClub login works; remove it, login fails

## Commit goal

`feat: Leadership manages the Kerberos Allowlist`
