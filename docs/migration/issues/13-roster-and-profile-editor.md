# 13 — Roster and Profile editor

**What to build:** Leadership can merge-edit the Roster. A Session can edit their own Profile Blocks (and Leadership can edit another Profile). Team photos and Alumni are Leadership-only. Names/avatars still flow onto Contributors after a Profile save.

**Blocked by:** 07, 08, 09

**Status:** done

**Seams:** Permissions + Content store.

## Acceptance criteria

- [x] Roster merge does not wipe Profile Blocks
- [x] Own Profile save allowed; other Profile save denied unless Leadership
- [x] Team Year photos and Alumni are Leadership-only
- [x] Visitor create from the people picker still works
- [x] People not on the Allowlist cannot sign in to self-edit (Gate already); Leadership edits them via Roster/Profile

## Verify

- Tests: own slug ok; other slug denied; Leadership other slug ok; Roster preserves a Block
- Manual: drag-drop one Block, save, open public Profile
- Manual: add Alumni as Leadership

## Commit goal

`feat: Roster merge and Profile Block editor on D1`
