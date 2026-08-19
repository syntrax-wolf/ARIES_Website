# 14 — Media upload to R2

**What to build:** An editor can attach photos (and short clips) that are resized in the browser, stored on R2, and referenced from a Project/Event/Profile. No Images product. No Worker transcode.

**Blocked by:** 10

**Status:** done

**Seam:** Upload policy (TDD). Fake R2 in tests.

## Acceptance criteria

- [x] Reject wrong type or oversize before store
- [x] Accept image → object keys for the small and large WebP variants
- [x] Accept short clip unchanged (existing size cap)
- [x] Upload kind still follows Level (team vs project vs member)
- [x] Public page can point `srcset` at the returned URLs

## Verify

- Tests: reject huge file; reject `.exe`; accept jpeg → two keys; video cap
- Manual: upload a photo in Project form, see it on the detail page (dev)
- Confirm no Images binding in wrangler

## Commit goal

`feat: browser-resized Media uploads to R2`
