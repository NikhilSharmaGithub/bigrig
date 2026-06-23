# Big Rig Components

Heavy-duty truck &amp; trailer parts e-commerce store.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Drizzle ORM |
| Payments | Stripe (Phase 2) |
| Auth | Auth.js (Phase 3) |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in DATABASE_URL
npm run dev                  # http://localhost:3000
```

## Database

Money is stored as integer **cents** throughout (`price_cents`, `total_cents`, …).

```bash
npm run db:generate   # create SQL migration from src/db/schema.ts
npm run db:push       # push schema directly to the DB (dev)
npm run db:migrate    # run committed migrations (prod)
npm run db:studio     # browse data in Drizzle Studio
```

Set `DATABASE_URL` in `.env.local` first (Supabase: Project Settings → Database → Connection string → URI).

## Project structure

```
src/
  app/                 # routes (App Router)
  components/
    brand/             # Logo, brand assets
    layout/            # Header, Footer, SearchBar
    product/           # ProductCard, etc.
  db/
    schema.ts          # Drizzle schema (15 tables)
    index.ts           # db client
  lib/
    catalog.ts         # category/brand/vehicle taxonomy
    sample-products.ts # placeholder data (replaced by DB in Phase 1)
```

## Roadmap

- [x] **Phase 0 — Foundation:** scaffold, design system, app shell, homepage, DB schema
- [x] **Phase 1 — Catalog:** category/PLP/PDP pages, search, shop-by-vehicle + fitment, DB seed *(code complete — run `db:push` + `db:seed` to populate)*
- [x] **Phase 2 — Commerce:** cart (guest + user), Stripe checkout, webhook, orders *(needs `STRIPE_*` env to transact)*
- [x] **Phase 3 — Accounts:** auth (session + bcrypt), order history + tracking, returns/RMA, addresses
- [x] **Phase 4 — Admin:** dashboard, product/inventory CRUD, order status, returns management *(at `/admin`, requires an admin user)*
- [x] **Phase 5 — Launch:** SEO (sitemap/robots/JSON-LD/OG), content + policy pages, contact form + admin inbox, deals, branded 404, deploy prep

### To go live locally
1. `DATABASE_URL` in `.env.local` → `npm run db:push && npm run db:seed`
2. For checkout: add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
3. Set a strong `AUTH_SECRET` (`openssl rand -base64 32`)
4. For the admin panel: register an account, then promote it —
   `UPDATE users SET role = 'admin' WHERE email = 'you@example.com';` — and visit `/admin`

### Deploy to Vercel
1. Push this repo to GitHub and import it in Vercel.
2. Add env vars in Vercel: `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL` (your production URL).
3. Run migrations against the production DB: `npm run db:migrate` (or `db:push`), then `db:seed` once.
4. In the Stripe dashboard, add a webhook to `https://<your-domain>/api/stripe/webhook` for `checkout.session.completed` and paste its signing secret into `STRIPE_WEBHOOK_SECRET`.
5. Set `NEXT_PUBLIC_BASE_URL` to your domain so canonical URLs, the sitemap, and OG tags are correct.
