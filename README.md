# WealthLens

WealthLens is a personal finance workspace for exploring a portfolio, market data, mutual funds, SIP projections, and transparent, rule-based allocation ideas. Sample financial figures are illustrative and the app is not investment, tax, or financial advice.

## What is included

- Responsive dark-first dashboard with portfolio performance, asset allocation, market watch, and educational insights.
- Markets, holdings, SIP goal calculator, mutual fund explorer, risk-based plan, and account preferences views.
- Email/password signup and login, bcrypt password hashes, short-lived JWT access tokens, rotating refresh tokens in HttpOnly cookies, and protected profile/portfolio/watchlist APIs.
- Rate-limited password reset with hashed, single-use tokens; delivery is sent through a configurable email webhook.
- First-login risk questionnaire saved to PostgreSQL; explainable allocation rules with tests.
- Pluggable market provider: mock data by default, or Alpha Vantage quotes and symbol search.
- Docker Compose stack for PostgreSQL, API, and web client.

## Run locally

Requirements: Node.js 22+, npm, and Docker Compose (for PostgreSQL and the full stack).

```sh
cp .env.example .env
docker compose up -d db
npm install
npm run db:generate
npm run db:migrate -w server -- --name init
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The demo workspace opens without an account or database. To use signup/login and save a risk profile, keep the database running and configure `DATABASE_URL` and `JWT_ACCESS_SECRET` in `.env`.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Local Docker Compose database |
| `JWT_ACCESS_SECRET` | Secret for 15-minute access JWTs; use a unique random secret of at least 32 characters | Set in `.env` |
| `CLIENT_ORIGIN` | Exact browser origin allowed by the API | `http://localhost:5173` |
| `PORT` | Express API port | `3001` |
| `MARKET_DATA_PROVIDER` | `mock` or `alpha-vantage` | `mock` |
| `ALPHA_VANTAGE_API_KEY` | Key used only by the Alpha Vantage adapter | Unset |
| `EMAIL_DELIVERY_URL` | Optional webhook that accepts `{ to, subject, text }` for reset emails | Unset |
| `EMAIL_DELIVERY_TOKEN` | Optional bearer token for the email webhook | Unset |

For a mock-data local run, leave `MARKET_DATA_PROVIDER=mock`; no market API key is needed. Live Alpha Vantage requests use its search and global-quote endpoints and are subject to provider availability and rate limits. Returned sample portfolio and fund data remains illustrative. Password reset requires a webhook at `EMAIL_DELIVERY_URL`; without one, the API responds that reset delivery is unavailable.

## Docker Compose

```sh
cp .env.example .env
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). The API container applies the Prisma schema at startup for this local Compose stack. For deployed environments, run Prisma migrations as a release step instead of `db push`, provide a strong `JWT_ACCESS_SECRET`, and restrict `CLIENT_ORIGIN` to the deployed client origin. Keep the client and API same-site (or route API requests through the client origin) so the refresh cookie remains HttpOnly and SameSite-protected.

## Checks

```sh
npm run build
npm test -w server
```

## API outline

- `POST /api/auth/signup`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`
- `GET /api/markets/search?q=...`, `GET /api/markets/quote/:symbol`
- Bearer-protected `GET /api/me`, `PUT /api/profile`, `GET /api/advice`, `GET` and `POST /api/portfolio/holdings`, and `GET /api/watchlist`

The included API persists users, risk profiles, portfolios, and holdings. The demo UI uses local sample holdings and does not sync demo edits to PostgreSQL. External Google OAuth requires provider credentials and is not configured in this starter. Mutual fund data is currently illustrative; no fund-data provider is wired in.

## Deployment notes

Build the Vite client with `npm run build -w client` and the Express API with `npm run build -w server`. Deploy the client as a static Vite site and the API with PostgreSQL; configure `VITE_API_URL` at client build time when the API is not reverse-proxied at `/api`. For cross-origin deployments, configure an exact CORS origin and same-site cookie strategy. Never use the example development secret in production.