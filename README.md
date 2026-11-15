# Lighting Hub SEO dashboard

Password-protected companion dashboard for the Pioneer Energy (lightinghub.sg) SEO proposal. Confidential client data: do not publish or link publicly.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind, Recharts. Deployed on Vercel.

## Security

- `src/proxy.ts` (Next.js 16's name for middleware) applies HTTP Basic Auth to every route, static assets included. Only `/robots.txt` is open.
- Credentials: set `DASHBOARD_USER` and `DASHBOARD_PASS` in Vercel env vars. Without them the site returns 503.
- Not indexed: robots meta tag, `X-Robots-Tag: noindex, nofollow` on every response, and `robots.txt` with `Disallow: /`.

## Data

- v1 is a static snapshot: `src/data/lightinghub-ga4-data.json` (GA4, 1 Dec 2025 to 15 Nov 2026).
- Only `src/lib/data.ts` reads it (`import "server-only"`), and pages call `getDashboardData()`. The JSON is never copied to `/public` or into client JavaScript.
- v2: replace the body of `getDashboardData()` with GA4 Data API calls (property `517079475`, service account as Viewer, daily revalidation) that return the same `DashboardData` shape from `src/lib/types.ts`.

## Local development

```bash
npm ci
DASHBOARD_USER=dev DASHBOARD_PASS=dev npm run dev
```
