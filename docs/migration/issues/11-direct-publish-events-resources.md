# 11 — Direct-publish Events and Resources

**What to build:** The same editor can direct-publish Events (Leadership / Listed Coordinator) and Resources (including Blogger).

**Blocked by:** 10

**Status:** done

**Seams:** Permissions + Content store.

## Acceptance criteria

- [x] Event save follows the same Listed rules as Projects
- [x] Resource save allowed for Leadership, Coordinator, and Blogger
- [x] Blogger cannot save a Project
- [x] Public Event and Resource pages read the new data after save

## Verify

- Tests: Blogger Resource ok; Blogger Project denied; Event Listed Coordinator ok
- Manual: one Event and one Resource round-trip in the editor

## Commit goal

`feat: direct-publish Events and Resources through the editor`
