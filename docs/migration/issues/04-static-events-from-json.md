# 04 — Static events from JSON backup

**What to build:** A visitor can browse upcoming and past Events and open an Event page, all prerendered from JSON.

**Blocked by:** 03

**Status:** done

**Seam:** Content store read (same reader as Projects).

## Acceptance criteria

- [x] `/events` splits upcoming and past by date
- [x] `/events/{slug}` shows one Event
- [x] Dates and types match the JSON backup

## Verify

- Test: fixture with one past and one future Event lands in the right lists
- Build prerenders a real Event from `content/events`
- Click through list → detail

## Commit goal

`feat: prerender Events from JSON backup`
