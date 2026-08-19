# ARIES Website — agent map

Astro on Cloudflare Workers + TypeScript + Tailwind v4. Public HTML is prerendered
static assets. Records live in D1; Media in R2. `content/*.json` is a backup/seed.
UI is small single-purpose islands. Find the file, make the change, done.

Orientation: [docs/README.md](docs/README.md). Glossary: [CONTEXT.md](CONTEXT.md).

## To change X, edit Y

| Change | File(s) |
| --- | --- |
| Brand colors (hex source of truth) | `src/config/colors.ts` — then mirror CSS vars in `src/app/globals.css` |
| Shadows, radii, glow/ring utility classes | `src/app/globals.css` |
| Nav links | `src/config/nav.ts` and `web/src/components/landing/TopNav.tsx` |
| Club socials / email / address | `src/config/socials.ts` |
| A member's profile content | D1 `members` (backup: `content/members/<slug>.json`) |
| A project | D1 `projects` (backup: `content/projects/<slug>.json`) |
| An event | D1 `events` (backup: `content/events/<slug>.json`) |
| Resources list | D1 `resources` (backup: `content/resources.json`) |
| Team rosters / years / alumni | D1 `team` (backup: `content/team.json`) |
| Content schemas (add a field) | `src/lib/types.ts`, readers in `web/src/lib/content/store.ts` |
| Permissions (Level / Listed) | `src/lib/permissions.ts` |
| Gate (Allowlist / Admin) | `web/src/lib/gate/gate.ts` |
| Landing | `web/src/pages/index.astro`, `web/src/components/landing/*` |
| Events page | `web/src/pages/events/`, `web/src/components/events/` |
| Projects page | `web/src/pages/projects/`, `web/src/components/projects/` |
| Team page | `web/src/pages/team/`, `web/src/components/team/` |
| Resources page | `web/src/pages/resources/`, `web/src/components/resources/` |
| Contact page | `web/src/pages/contact.astro`, `web/src/components/contact/ContactForm.tsx` |
| Member Profile | `web/src/pages/[slug].astro`, `web/src/components/profile/` |
| Member login | `/admin` — IIT Delhi via DevClub (`/api/auth/devclub`) or Admin password |
| Admin editor | `web/src/pages/admin/editor.astro`, `web/src/components/admin/` |
| Content write API | `web/src/pages/api/admin/save.ts` → D1 |
| Image uploads | `web/src/pages/api/admin/upload.ts` → R2 (browser-resized WebP) |
| Seed JSON → local D1 | `npm run db:seed` |

## Routing

- `/` landing (own top navbar)
- `/events`, `/projects`, `/team`, `/resources`, `/contact` — prerendered public pages
- `/<member-slug>` member profile. Static routes win over the dynamic slug. `?from=team` or `?from=project:<slug>` renders the back control.
- `/admin` Gate login → `/account`. Allowlisted / Admin open `/admin/editor`
- `/api/*` and `/account` SSR on the Worker. Public HTML is static assets.

## Conventions

- Public pages read via `web/src/lib/content/build-store.ts` (JSON backup, or D1 when `ARIES_CONTENT_SOURCE=d1`).
- Club role is `members.level` (never IdP claims): `oc` | `co_overall_coordinator` | `research_lead` | `coordinator` | `executive` | `member` | `alumni` | `visitor` | `blogger`.
- Gate is Allowlist-only (DevClub Kerberos) plus the bootstrap Admin password. No signup.
- Profile JSON: own session slug only. Roster (name/Kerberos/level): leadership, merge-only. Projects/events: leadership any; coordinator/executive only if listed.
- Env names (not secrets) in `web/.env.example`: `SESSION_SECRET`, `ADMIN_PASSWORD`, DevClub, `ARIES_CONTENT_SOURCE`, `ARIES_ALLOWLIST`, `MEDIA_PUBLIC_BASE`, `REBUILD_HOOK_URL`.
- Images: existing `/images/...` in `public/`; new uploads → R2, served at `/media/...`.
- Icons: `lucide-react` (no brand icons).
- Run: `npm run dev` (Astro at http://localhost:4321/). Production DNS is not changed by agents unless a human asks.

## Contributors
* @dv-sh - Developer / Collaborator Request
