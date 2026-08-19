# ARIES Website

Astro + Cloudflare Workers site for the ARIES club at IIT Delhi. Public pages are
prerendered static assets. The club editor is behind an Allowlist Gate.

## Stack

- **Framework:** Astro 7 + React 19 islands + TypeScript
- **Host:** Cloudflare Workers (`web/wrangler.jsonc`), not Pages
- **Styling:** Tailwind CSS v4 + CSS variables (`src/app/globals.css`)
- **Records:** D1 (`aries-content`)
- **Media:** R2 (`aries-media`), resized to WebP in the browser
- **Content backup:** `content/*.json` (seed with `npm run db:seed`)
- **Icons:** `lucide-react`

## Development

Copy `web/.env.example` to `web/.env` and fill in Gate secrets plus DevClub OAuth:

```bash
SESSION_SECRET=
ADMIN_PASSWORD=
DEVCLUB_CLIENT_ID=
DEVCLUB_CLIENT_SECRET=
DEVCLUB_REDIRECT_URI=http://localhost:4321/api/auth/callback/devclub
```

Register the redirect URI at [auth.devclub.in](https://auth.devclub.in/docs). Allowlisted Kerberos ids sign in with IIT Delhi; the Admin password is the only email/password login.

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

## Common scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Astro dev server |
| `npm run build` | Prerender public HTML + Worker bundle |
| `npm run db:seed` | Seed local D1 from `content/*.json` |
| `npm test` | Seam tests (Permissions, Gate, Content store, Upload policy) |

## Project layout

- `web/src/pages/` — Astro routes (public prerender + Gate/editor SSR)
- `web/src/components/` — React islands
- `web/src/lib/content/` — D1 content store and publish/queue
- `web/src/lib/gate/` — Allowlist Gate
- `web/src/lib/media/` — R2 upload policy
- `src/lib/permissions.ts` — Level / Listed rules
- `src/lib/types.ts` — content schemas
- `content/` — JSON backup used to seed D1

See `AGENTS.md` for the file-to-change map. Glossary: `CONTEXT.md`.
