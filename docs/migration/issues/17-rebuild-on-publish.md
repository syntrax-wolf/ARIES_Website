# 17 — Rebuild public HTML on publish

**What to build:** After a direct publish or approved Change Request, a rebuild runs so visitors get new static HTML. Public routes must not invoke the Worker in production.

**Blocked by:** 10, 02

**Status:** done

## Acceptance criteria

- [x] Successful publish triggers the rebuild hook (or documented deploy command)
- [x] Production routing serves public pages as static assets
- [x] Editor and Gate routes still SSR
- [x] Failure of rebuild does not leave a half-applied D1 write without a log (retry or surface the error)

## Verify

- Publish a Project, wait for rebuild, curl the public URL — no Worker CPU needed (static asset / 200 from assets)
- Curl `/admin` — Worker runs (not a static file)
- Document the hook in `.env.example` only as names, not secrets

## Commit goal

`feat: rebuild static site after CMS publish`
