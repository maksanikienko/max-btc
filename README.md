# Max BTC — Crypto Trading Terminal

A full-stack crypto trading terminal with real-time market data, virtual portfolio management, price alerts, and collaborative trading rooms.

**Backend:** NestJS 11 · TypeScript · PostgreSQL + Prisma 6 · Socket.io · Binance WebSocket  
**Frontend:** Vue 3 · Vite · Pinia · Tailwind CSS · lightweight-charts

---

## Features

- **Live market data** — real-time ticker prices streamed from Binance via WebSocket
- **Candlestick charts** — interactive TradingView-style charts powered by lightweight-charts
- **Virtual portfolio** — paper trading with balance tracking and trade history
- **Watchlist** — per-user symbol lists with live price updates
- **Price alerts** — configurable alerts checked every 10 seconds
- **Collaborative rooms** — shared trading rooms with real-time chat
- **In-app notifications** — alert triggers and room events
- **Authentication** — JWT-based auth (access + refresh tokens) with Google OAuth support

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | NestJS 11, TypeScript, Passport, JWT |
| Database | PostgreSQL, Prisma 6 |
| Real-time | Socket.io, Binance WebSocket stream |
| Scheduler | `@nestjs/schedule` (price alert cron) |
| Frontend | Vue 3 (Composition API), Vite, Pinia, vue-router |
| UI | Tailwind CSS, radix-vue, class-variance-authority |
| Charts | lightweight-charts |
| HTTP client | Axios (with JWT refresh interceptor) |

---

## Repository Structure

```
max-btc/
├── src/                  # NestJS backend
│   ├── common/           # Guards, decorators, filters
│   ├── config/           # Typed env configuration
│   ├── database/         # PrismaService (global)
│   ├── services/         # BinanceWsService (global)
│   ├── gateways/         # Socket.io /trading namespace
│   └── modules/          # auth, user, market, watchlist, alert, portfolio, room, notification
├── prisma/               # schema.prisma + migrations
├── client/               # Vue 3 SPA
│   └── src/
│       ├── components/   # Chart, TickerBar, TradePanel, Watchlist, UI primitives
│       ├── stores/       # Pinia stores (auth, market, portfolio, alerts, rooms, notifications)
│       ├── views/        # AuthView, TerminalView, PortfolioView, AlertsView, RoomsView
│       ├── services/     # Shared axios instance + socket.io-client
│       └── router/       # vue-router + auth guard
└── test/                 # Jest e2e config
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- A [Binance](https://www.binance.com) account is **not** required — the app uses the public WebSocket stream

### 1. Clone and install

```bash
git clone <repo-url>
cd max-btc
npm install
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `GOOGLE_CALLBACK_URL` | Must match the redirect URI in Google Cloud Console |
| `FRONTEND_URL` | Frontend origin (default: `http://localhost:5173`) |

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Start the development servers

**Terminal 1 — API (port 3000):**

```bash
npm run start:dev
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add `http://localhost:3000/api/auth/google/callback` as an **Authorized redirect URI**
4. Copy the Client ID and Client Secret into your `.env`

---

## API Overview

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/google
GET    /api/auth/google/callback

GET    /api/users/me
PATCH  /api/users/me

GET    /api/market/tickers
GET    /api/market/ticker/:symbol

GET    /api/watchlist
POST   /api/watchlist
DELETE /api/watchlist/:symbol

GET    /api/alerts
POST   /api/alerts
DELETE /api/alerts/:id

GET    /api/portfolio
GET    /api/portfolio/trades
POST   /api/portfolio/trade
POST   /api/portfolio/deposit

GET    /api/rooms
POST   /api/rooms
GET    /api/rooms/:id
POST   /api/rooms/:id/join
POST   /api/rooms/:id/leave
DELETE /api/rooms/:id

GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

All protected routes require `Authorization: Bearer <accessToken>`.

---

## WebSocket Events (`/trading` namespace)

### Client → Server

| Event | Payload | Effect |
|---|---|---|
| `subscribe:ticker` | `"BTCUSDT"` | Join ticker room, receive live updates |
| `unsubscribe:ticker` | `"BTCUSDT"` | Leave ticker room |
| `joinRoom` | `"roomId"` | Join a trading room |
| `leaveRoom` | `"roomId"` | Leave a trading room |
| `room:message` | `{ roomId, message }` | Broadcast message to room members |

### Server → Client

| Event | Trigger |
|---|---|
| `ticker` | Binance price update for subscribed symbol |
| `room:userJoined` | A user joined the room |
| `room:userLeft` | A user left the room |
| `room:message` | Chat message from a room member |

---

## Scripts

```bash
# Backend (repo root)
npm run start:dev       # development with hot reload
npm run start:prod      # production
npm run build           # compile TypeScript
npm run test            # unit tests
npm run test:e2e        # end-to-end tests
npm run test:cov        # test coverage
npm run lint            # ESLint
npx prisma studio       # Prisma Studio GUI

# Frontend (client/)
npm run dev             # Vite dev server
npm run build           # production build (type-checks + Vite)
npm run preview         # preview production build
```

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
