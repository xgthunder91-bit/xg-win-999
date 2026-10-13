# XG Win 99 — Admin Console

Standalone, separately-deployable admin dashboard for the XG Win 99 platform. It connects to the same
backend API as the game and lets you monitor and fix users in real time.

This app is completely independent from the game frontend: it has its own `package.json`, build, and
deploy target. Both apps talk to the **same backend** (`server.ts` in the repo root).

## Features

- **Login** with the admin key (stored in `localStorage` as `xgwin99_admin_key`).
- **Overview** — total users, online/offline, betting vs. non-betting, total bets/wagered, wallet
  balances, pending deposits/withdrawals.
- **Users** — search by phone or UID, filter by online / offline / betting / non-betting / banned.
  Table shows balance, bets, wagered, won, current screen, last-seen.
- **User drawer** —
  - Credit / debit / **set** wallet balance (with an audit note) — use _set_ to force-fix a stuck balance.
  - Ban / unban a user.
  - Free-text problem/note field.
  - Transaction, deposit, and withdrawal history for that user.
- **Deposits** — filter and approve/reject pending UPI deposits (approval credits the wallet).
- **Withdrawals** — approve or reject (rejection refunds the wallet).
- Auto-refreshes every 10s.

## Setup

```bash
cd admin-web
npm install --legacy-peer-deps
```

Create `.env` (copy from `.env.example`) and point it at your backend:

```
VITE_API_BASE_URL=http://localhost:8080/api
VITE_PROXY_TARGET=http://localhost:8080
```

## Develop

```bash
npm run dev      # http://localhost:4000
```

## Build & deploy

```bash
npm run build    # outputs to admin-web/dist
```

Deploy `admin-web/dist` as a static site (Netlify/Vercel/Nginx/any host). In production set
`VITE_API_BASE_URL` to your deployed backend URL, e.g. `https://api.yourdomain.com/api`, then rebuild.

The backend must allow CORS from the admin origin and must be reachable over HTTPS.

Default admin key (`ADMIN_KEY` in the root `.env`): `change_this_admin_key_123` — **change this in production.**
