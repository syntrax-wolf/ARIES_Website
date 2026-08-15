# ARIES Website — agent map

Next.js (App Router) + TypeScript + Tailwind v4. Live content is Supabase
(ARIES_Website project); `content/*.json` is a backup. UI is small
single-purpose components. Find the file, make the change, done.

## To change X, edit Y

| Change | File(s) |
| --- | --- |
| Brand colors (hex source of truth) | `src/config/colors.ts` — then mirror CSS vars in `src/app/globals.css` |
| Shadows, radii, glow/ring utility classes | `src/app/globals.css` |
| Nav links (sidebar, top navbar, footer columns) | `src/config/nav.ts` |
| Club socials / email / address | `src/config/socials.ts` |
| A member's profile content | Supabase `members` (backup: `content/members/<slug>.json`) |
| A project | Supabase `projects` (backup: `content/projects/<slug>.json`) |
| An event | Supabase `events` (backup: `content/events/<slug>.json`) |
| Resources list | Supabase `resources` (backup: `content/resources.json`) |
| Team rosters / years / alumni | Supabase `team` (backup: `content/team.json`) |
| Content schemas (add a field) | `src/lib/types.ts`, readers in `src/lib/content.ts` |
| Left sidebar (collapse, mobile drawer, art) | `frontend/shared/layout/Sidebar.tsx` |
| Landing top navbar | `frontend/pages/landing/TopNav.tsx` |
| Landing footer (mountain + copyright) | `frontend/pages/landing/FaqAndFooter.tsx` (also `SiteFooter.tsx`) |
| Sticky landing header | `frontend/pages/landing/TopNav.tsx` |
| Landing sections | `frontend/pages/landing/*` |
| Events page UI / filters | `frontend/pages/events/EventsExplorer.tsx`, card: `frontend/shared/cards/EventCard.tsx` |
| Projects page UI / search | `frontend/pages/projects/ProjectsExplorer.tsx`, card: `frontend/shared/cards/ProjectCard.tsx` |
| Team page UI | `frontend/pages/team/*`, card: `frontend/shared/cards/PersonCard.tsx` |
| Resources page UI | `frontend/pages/resources/ResourcesExplorer.tsx` |
| Contact page | `src/app/(site)/contact/page.tsx`, form: `frontend/pages/contact/ContactForm.tsx` |
| Club email / LinkedIn | `src/config/socials.ts` |
| Member login | `/admin` — IIT Delhi via DevClub OAuth (`/api/auth/devclub`). Staff password dual-run still on the login page. |
| Profile page layout / hero / back-button logic | `src/app/[slug]/page.tsx` |
| How a profile section renders | `frontend/shared/profile/blocks.tsx` (one renderer per block type) |
| Profile 2-column packing | `frontend/shared/profile/BlockGrid.tsx` |
| Admin login | `src/app/admin/page.tsx` |
| Admin editor (drag-drop blocks, project/event forms, approvals) | `frontend/pages/admin/*` |
| Content write API | `src/app/api/admin/save/route.ts` → Supabase (+ approval queue for executives) |
| Image uploads | `src/app/api/admin/upload/route.ts` → Supabase Storage `media` |
| Seed / re-import JSON → Supabase | `npm run db:seed:supabase` (needs `SUPABASE_SERVICE_ROLE_KEY`) |
| Export Supabase → JSON backup | `npm run content:export` |
| Import member passwords from Form CSV | `npm run auth:import-credentials -- file.csv` |
| Import members from Excel + Drive photos | `npm run import:excel -- <file.xlsx>` → `scripts/import-from-excel.mjs` |

## Routing

- `/` landing (own top navbar, no sidebar)
- `/(site)/...` = events, projects, team, resources, contact + detail pages — all share the collapsible sidebar via `src/app/(site)/layout.tsx`
- `/<member-slug>` member profile at the root (short URLs). Static routes win over the dynamic slug. `?from=team` or `?from=project:<slug>` renders the "Back to X" button.
- `/admin` DevClub login → `/account` (leadership/blogger can open `/admin/editor`)

## Conventions

- Public pages read via `src/lib/content.ts` (Supabase). Keep `content/` as backup.
- Club role is `members.level` (never IdP claims or a client-posted slug): `oc` | `co_overall_coordinator` | `research_lead` | `coordinator` | `executive` | `member` | `alumni` | `visitor` | `blogger`.
- Profile JSON: own session slug only. Roster (name/Kerberos/level): leadership, merge-only. Projects/events: leadership any; coordinator/executive only if listed.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, server `SUPABASE_SERVICE_ROLE_KEY`, DevClub `DEVCLUB_CLIENT_ID` / `DEVCLUB_CLIENT_SECRET` / `DEVCLUB_REDIRECT_URI`.
- Images: existing `/images/...` in `public/`; new uploads → Storage bucket `media`.
- Category chip colors: `frontend/shared/ui/CategoryBadge.tsx`.
- Icons: `lucide-react` (no brand icons — use monogram tiles like Contact page).
- Run: `npm run dev`.

## Contributors
* @dv-sh - Developer / Collaborator Request
