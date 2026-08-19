# 16 — Fold Sanity blogs into Resources

**What to build:** Existing Sanity posts appear as Resources. Studio is gone. Old `blog-` slugs still open.

**Blocked by:** 11

**Status:** done

## Acceptance criteria

- [x] Import or copy Sanity posts into the Resources document
- [x] `/resources/blog-{slug}` (or the chosen stable slug) still renders
- [x] `/studio` is removed
- [x] No Sanity client in the public reader

## Verify

- Test: imported fixture post is returned as a Resource of type Blog
- Build: no `@sanity` import on public pages
- Spot-check one former Studio post on the Resources list

## Commit goal

`feat: Resources absorb Sanity blogs; remove Studio`
