# ARIES Website — agent map

Astro on Cloudflare Workers + TypeScript + Tailwind v4. Public HTML is prerendered
static assets. Records live in D1; Media in R2. `content/*.json` is a backup/seed.
UI is small single-purpose islands. Find the file, make the change, done.

Orientation: [docs/README.md](docs/README.md). Glossary: [CONTEXT.md](CONTEXT.md).
Layout: [README.md](README.md).

## To change X, edit Y

| Change | File(s) |
| --- | --- |
| Brand colors (hex source of truth) | `web/src/config/colors.ts` — then mirror CSS vars in `web/src/styles/globals.css` |
| Shadows, radii, glow/ring utility classes | `web/src/styles/globals.css` |
| Nav links | `web/src/config/nav.ts`, `web/src/components/layout/Sidebar.tsx` (inner pages), `web/src/components/landing/TopNav.tsx` (landing) |
| Club socials / email / address | `web/src/config/socials.ts` |
| A member's profile content | D1 `members` (backup: `content/members/<slug>.json`) |
| A project | D1 `projects` (backup: `content/projects/<slug>.json`) |
| An event | D1 `events` (backup: `content/events/<slug>.json`) |
| Resources list | D1 `resources` (backup: `content/resources.json`) |
| Team rosters / years / alumni | D1 `team` (backup: `content/team.json`) |
| Content schemas (add a field) | `web/src/lib/types.ts`, readers in `web/src/lib/content/store.ts` |
| Permissions (Level / Listed) | `web/src/lib/permissions.ts` |
| Gate (Allowlist / Admin) | `web/src/lib/gate/gate.ts` |
| Worker bindings (D1, R2) | `web/wrangler.jsonc` |
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
| Seed JSON → local D1 | `pnpm db:seed` |
| Postgres → content JSON | `pnpm content:export-postgres` |
| Sanity blogs → Resources | `pnpm content:export-sanity` then `pnpm content:ingest-sanity` |
| Deploy Worker | `pnpm deploy` (build + wrangler) |

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
- Env names (not secrets) in `web/.dev.vars.example`. Local secrets: `web/.dev.vars`. Production: `pnpm wrangler secret put`.
- Images: existing `/images/...` in `public/`; new uploads → R2, served at `/media/...`.
- Icons: `lucide-react` (no brand icons).
- Package manager is **pnpm** (never npm). Run: `pnpm dev` (Astro at http://localhost:4321/). Production DNS is not changed by agents unless a human asks.

## Contributors
* @dv-sh - Developer / Collaborator Request
