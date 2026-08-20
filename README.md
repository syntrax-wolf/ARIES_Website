# ARIES Website

Astro + Cloudflare Workers site for the ARIES club at IIT Delhi. Public pages are
prerendered static assets. The club editor is behind an Allowlist Gate.

## Stack

- **Framework:** Astro 7 + React 19 islands + TypeScript
- **Host:** Cloudflare Workers (`web/wrangler.jsonc`), not Pages
- **Styling:** Tailwind CSS v4 + CSS variables (`web/src/styles/globals.css`)
- **Records:** D1 (`aries-content`)
- **Media:** R2 (`aries-media`), resized to WebP in the browser
- **Content backup:** `content/*.json` (seed with `pnpm db:seed`)
- **Icons:** `lucide-react`

## Development

Copy `web/.dev.vars.example` to `web/.dev.vars` and fill in Gate secrets plus DevClub OAuth. Wrangler reads `.dev.vars` next to `web/wrangler.jsonc`. Production does **not** use this file — put the same names with `pnpm wrangler secret put`.

```bash
SESSION_SECRET=
ADMIN_PASSWORD=
DEVCLUB_CLIENT_ID=
DEVCLUB_CLIENT_SECRET=
DEVCLUB_REDIRECT_URI=http://localhost:4321/api/auth/callback/devclub
```

Register the redirect URI at [auth.devclub.in](https://auth.devclub.in/docs). Allowlisted Kerberos ids sign in with IIT Delhi; the Admin password is the only email/password login.

```bash
pnpm install     # once
pnpm dev         # http://localhost:4321/
pnpm build       # prerender public HTML + Worker bundle
pnpm test        # seam tests
pnpm db:seed     # load content/*.json into local D1
pnpm content:export-sanity   # pull Sanity blogs (needs SANITY_PROJECT_ID)
pnpm content:ingest-sanity   # merge into content/resources.json
pnpm deploy      # astro build && wrangler deploy
```

## Project layout

**Edit `web/`.** That is the live site.

```
aries-website-26/
├── web/                      # live Astro app (Cloudflare Worker)
│   ├── src/pages/            # routes
│   ├── src/components/       # React islands (public UI + editor)
│   ├── src/config/           # colors, nav, socials
│   ├── src/styles/           # Tailwind + brand CSS vars
│   ├── src/lib/content/      # D1 store, publish, queue, roster
│   ├── src/lib/gate/         # Allowlist Gate + session cookie
│   ├── src/lib/media/        # R2 upload policy
│   ├── src/lib/types.ts      # content schemas
│   ├── src/lib/permissions.ts
│   ├── migrations/           # D1 SQL
│   ├── wrangler.jsonc        # Worker, D1, R2
│   └── astro.config.mjs
├── content/                  # JSON backup / D1 seed
├── public/                   # Chrome and other static files
├── docs/                     # glossary, ADRs, completed rewrite tickets
├── CONTEXT.md                # club vocabulary
└── AGENTS.md                 # file-to-change map
```

### Routes (`web/src/pages/`)

| URL | What |
| --- | --- |
| `/` | Landing |
| `/projects`, `/projects/[slug]` | Project list and detail |
| `/events`, `/events/[slug]` | Event list and detail |
| `/team` | Team Years and Alumni |
| `/resources`, `/resources/[slug]` | Resources (including former Studio posts) |
| `/contact` | Mailto contact |
| `/[slug]` | Member Profile |
| `/blog/[slug]` | 301 → `/resources/blog-{slug}` |
| `/admin` | Gate login |
| `/account` | Signed-in home |
| `/admin/editor` | CMS |
| `/api/auth/*` | DevClub + Admin login / logout |
| `/api/admin/*` | Save, upload, approvals, Allowlist |
| `/media/[...key]` | R2 (or in-memory) Media |

Public HTML prerenders to static assets. Gate, editor, APIs, and `/media` run on the Worker.

See `AGENTS.md` for the file-to-change map. Glossary: `CONTEXT.md`.
