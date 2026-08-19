# 09 — Access Gate

**What to build:** Only Allowlisted Kerberos (DevClub) and the bootstrap Admin password receive a Session. Everyone else is refused with no cookie. No signup.

**Blocked by:** 02, 08

**Status:** done

**Seam:** Gate (TDD).

## Acceptance criteria

- [x] Kerberos on the Allowlist → Session cookie
- [x] Kerberos not on the Allowlist → no Session, clear error
- [x] Admin password matches the secret → Session as bootstrap Admin
- [x] Any other email/password → no Session
- [x] There is no signup endpoint
- [x] Public pages still need no cookie

## Verify

- Tests: allow, deny, Admin success, Admin fail, cookie round-trip, missing signup
- Manual: DevClub callback with a stub Kerberos; password form with wrong then right secret
- Middleware/session code does not run on prerendered public HTML

## Commit goal

`feat: Allowlist Gate with DevClub and Admin-only password`
