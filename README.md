# Lighting Hub SEO dashboard

Password-protected companion dashboard for the Pioneer Energy (lightinghub.sg) SEO proposal. Confidential client data: do not publish or link publicly.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind, Recharts. Deployed on Vercel.

## Security

- `src/proxy.ts` (Next.js 16's name for middleware) applies HTTP Basic Auth to every route, static assets included. Only `/robots.txt` is open.
- Credentials: set `DASHBOARD_USER` and `DASHBOARD_PASS` in Vercel env vars. Without them the site returns 503.
- Not indexed: robots meta tag, `X-Robots-Tag: noindex, nofollow` on every response, and `robots.txt` with `Disallow: /`.

## Local development

```bash
npm ci
DASHBOARD_USER=dev DASHBOARD_PASS=dev npm run dev
```
