# Sanctyria Web

The Sanctyria web application is a server-rendered SvelteKit site for the public marketing experience, community platform, and Core administration workspace.

## Features

- Public marketing pages, journal, studio, and search-engine/social metadata.
- A privacy-choice banner gates first-party pageview aggregates and optional browser error monitoring until visitors opt in.
- The sitemap includes only published editorial routes and user-generated pages that pass the server-side indexing policy.
- Community feeds, profiles with customizable avatar and banner image URLs, communities, replies, notifications, and moderation.
- Global administration under `/core`, including user, community, moderation, marketing, banner, and analytics tools.
- Server-side generated 1200 × 630 PNG social preview images for branded routes and community/profile pages.
- Same-origin community API proxy at `/api/community/*`.

The app is organized with SvelteKit route groups; group names in parentheses are not part of public URLs.

| Area           | Source directory          | Public routes                                                                                                          |
| -------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Marketing      | `src/routes/(marketing)/` | `/`, `/about`, `/journal`, `/studio`, and related pages                                                                |
| Community      | `src/routes/(community)/` | `/home`, `/r/:communityName`, `/u/:username`, `/p/:postId`, `/search`, and related pages                               |
| Administration | `src/routes/(admin)/`     | `/core`, `/core/users`, `/core/communities`, `/core/moderation`, `/core/marketing`, `/core/banners`, `/core/analytics` |

## Requirements

- Node.js 22 or newer
- npm
- The Sanctyria Backend running locally or reachable from the web server

## Local development

From this directory:

```sh
npm install
npm run dev
```

By default, the community API proxy targets `http://127.0.0.1:3000` outside production. Production requires `COMMUNITY_BACKEND_URL`; set it to the backend origin in the frontend process environment before starting the server. `VITE_SENTRY_DSN` is optional and enables browser error monitoring only after a visitor accepts optional analytics and diagnostics.

Run the backend separately from `../Backend/`. The web UI and same-origin proxy are not substitutes for backend authentication or authorization; protected actions are verified by the API.

## Scripts

| Command           | Description                                                        |
| ----------------- | ------------------------------------------------------------------ |
| `npm run dev`     | Start the Vite/SvelteKit development server.                       |
| `npm run check`   | Synchronize SvelteKit types and run Svelte/TypeScript diagnostics. |
| `npm run build`   | Create the production build.                                       |
| `npm run preview` | Serve the production build locally.                                |
| `npm run lint`    | Run Prettier checks and ESLint.                                    |
| `npm run format`  | Format project files with Prettier.                                |

## Social preview images

The `/api/og/page`, `/api/og/profile/:username`, and `/api/og/community/:slug` endpoints return generated 1200 × 630 PNG images. Profile and community previews use their avatar when available, otherwise their banner image; when neither is available, profile previews use initials and community previews use the branded character artwork. The `sharp` dependency renders and optimizes the PNGs.

Journal article pages use each article's own image. Shared image posts use the post image, and link-preview cards use the linked page's metadata image when available; the branded artwork is used only when no thumbnail exists.

Social platforms cache previews. After updating metadata or imagery, use the platform's link-preview debugger or wait for its cache to refresh.

## IndexNow verification

The root-level `<key>.txt` file verifies this site for IndexNow. Keep it synchronized with `INDEXNOW_KEY` in the production backend environment; the value is intentionally public. The backend sends notifications for eligible content changes, and its one-time sitemap submission command is documented in `../Backend/README.md`.

## Source layout

```text
src/
  routes/
    (marketing)/          Public marketing and journal pages
    (community)/          Community pages and same-origin API proxy
    (admin)/              Core administration pages
    api/og/               Generated social preview image endpoints
  lib/
    community/            Community API client, models, and components
    core/                 Core administration helpers
    marketing/            Marketing content, SEO, and components
    server/               Server-only image rendering utilities
    shared/               Shared assets and utilities
static/
  assets/                 Logo, character artwork, and static media
```

## Deployment notes

- Deploy to Netlify with the configured Node-based `adapter-netlify` adapter. The Netlify build uses Node.js 22, runs `npm run build`, and publishes the adapter's `build/` output. This is a server-rendered deployment using Netlify Functions, not Edge Functions.
- When deploying this monorepo, set Netlify's base directory to `Web-Svelte` so it uses this directory's `netlify.toml`.
- The adapter generates a Netlify server function with a catch-all route for SvelteKit pages, so deep links and reloads are handled by SvelteKit. Do not add the static-SPA `/* /index.html 200` fallback: this app has no root `index.html`, and that rule would bypass server-rendered routing.
- Set `COMMUNITY_BACKEND_URL` to the backend's private/reachable HTTP or HTTPS origin in the web server environment. Production API requests require it; the proxy returns an explicit `503` configuration error if it is missing or invalid. Keep the API same-origin to browsers through the `/api/community/*` proxy.
- The proxy caps forwarded request bodies at 1 MiB and ordinary upstream requests at 15 seconds. The `/api/community/events` SSE request is exempt from the proxy timeout; backend streams are capped at 15 minutes.
- Keep SvelteKit routes and helpers platform-neutral when possible. If moving away from Netlify, replace `adapter-netlify` with the target platform's adapter and validate a deployment build there.
- The social image routes run on the server and require the Node-compatible `sharp` package and the files under `static/assets/`.
- Branded social-preview text is rendered with Noto Sans and Noto Serif from `static/assets/fonts/` to avoid dependence on fonts installed by the hosting platform. `netlify.toml` includes those fonts and the renderer's image assets in the server function package. The included SIL Open Font License files document redistribution terms.
- Configure the production site's canonical origin consistently with the `https://sanctyria.com` social metadata URLs.
- The privacy banner stores a versioned choice in browser local storage. Optional first-party pageview aggregates and browser Sentry are disabled until opt-in; Do Not Track remains honored. Review the consent wording, applicable regional requirements, disclosures, and retention policy before production use.
- Configure `VITE_SENTRY_DSN` for the browser project and `SENTRY_DSN` for the backend project only after creating the corresponding Sentry projects. Both SDK integrations disable automatic user, cookie, header, body, and query-string collection; the browser SDK starts only after optional consent.
- Apply backend migrations before deploying the indexing policy. Community pages require Core approval and current quality thresholds; profiles remain noindex unless the member opts in and meets the profile eligibility checks.
- Verify `https://sanctyria.com` in Google Search Console and Bing Webmaster Tools, then submit `https://sanctyria.com/sitemap.xml`. The full operational checklist is in `SEO_ANALYTICS_PLAN.md`.
- Keep secrets in the hosting platform's secret manager; do not commit `.env` files, API keys, or credentials.

## Related service

The Fastify API, PostgreSQL schema, migrations, and backend setup are documented in [`../Backend/README.md`](../Backend/README.md).
