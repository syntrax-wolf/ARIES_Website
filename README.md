# ARIES Website

Next.js (App Router) + TypeScript + Tailwind v4 site for the ARIES club at IIT Delhi.

## Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + CSS variables (`src/app/globals.css`)
- **CMS / Database:** Supabase (Postgres + Auth + Storage)
- **Content backup:** `content/*.json` (refresh with `npm run content:export`)
- **Icons:** `lucide-react`

## Development

Copy `.env.example` to `.env.local` and fill in Supabase plus DevClub OAuth:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEVCLUB_CLIENT_ID=
DEVCLUB_CLIENT_SECRET=
DEVCLUB_REDIRECT_URI=http://localhost:3000/api/auth/callback/devclub
```

Register the redirect URI at [auth.devclub.in](https://auth.devclub.in/docs). Members sign in with IIT Delhi; staff password login remains as a dual-run fallback.

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Common scripts

| Script | Purpose |
| --- | --- |
| `npm run db:seed:supabase` | Seed Supabase from `content/*.json` (needs `SUPABASE_SERVICE_ROLE_KEY`) |
| `npm run content:export` | Export Supabase tables back to `content/*.json` |
| `npm run auth:import-credentials -- file.csv` | Import member login credentials from a form CSV |
| `npm run import:excel -- <file.xlsx>` | Import members from Excel + download Drive photos |
| `npm run lint` | Run ESLint |
| `npm run build` | Production build |

## Project layout

- `src/app/(site)/` — public pages (events, projects, team, resources, contact)
- `src/app/[slug]/` — member profile pages (short URLs)
- `src/app/admin/` — login + editor for members, projects, events, team
- `src/lib/content.ts` — public content readers (Supabase)
- `src/app/api/admin/` — Next.js API routes for saves, uploads, and approvals
- `content/` — JSON backup of Supabase data

See `AGENTS.md` for the file-to-change map.
