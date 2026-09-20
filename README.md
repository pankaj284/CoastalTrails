# Coastal Trails — Gokarna Connect

Curated coastal homestays across Gokarna, Karnataka — a Flutter mobile app and a React web experience sharing one Express + SQLite backend.

**The Coastal Trails Standard:** 10% fair host model (₹0 convenience fee), 20% online hold with 80% payable at the property, and every cottage mapped with cliff trails, ferry timings, and auto dispatcher helplines.

## Repository layout

```
lib/                      Flutter app (Android/iOS/web)
website/client/           React + Vite + TypeScript + Tailwind web app
website/client/DESIGN.md  Design system contract ("Deep Water Cartography")
website/server/           Express API + SQLite database
website/server/db/        Schema (schema.sql) and demo data (seed.js)
```

## Getting started

### 1. API + web (main development loop)

```bash
cd website/server
npm install
npm run seed      # creates the SQLite DB and loads 12 demo stays, routes & bookings
npm run dev       # API on http://localhost:5000

cd ../client
npm install
npm run dev       # web app on http://localhost:3000 (proxies /api → :5000)
```

Production-style preview: `npm run build` then `npm run preview` (port 4173).

### 2. Flutter app

```bash
flutter pub get
flutter run       # connects to http://localhost:5000 (10.0.2.2 from the Android emulator)
```

## Demo data

- **Stays:** 12 homestays across 6 enclaves (Kudle, Om, Half Moon, Paradise, Main Beach, Town)
- **Bookings:** `GK-782941` (confirmed), `GK-913482` (awaiting host), `GK-654127` (confirmed)
- **Demo login:** use the "Instant demo traveler login" on the sign-in screen (bookings are login-gated)
- Reset everything anytime: `cd website/server && npm run seed`

## Useful scripts

| Where | Command | What it does |
|---|---|---|
| `website/server` | `npm run seed` | Resets DB to the demo dataset |
| `website/server` | `npm start` | Runs the API (port 5000, or `PORT` env) |
| `website/client` | `npm run dev` | Dev server with hot reload (port 3000) |
| `website/client` | `npm run build` | Type-check + production build |

## Notes for contributors

- Design decisions trace to `website/client/DESIGN.md` — extend the token system there first, never hardcode colors/sizes in components.
- Availability/reserved dates come **only** from the database (`room_unavailability` table via `/api/homestays/availability` and `/api/homestays/:id/availability`).
- The local database is gitignored — every contributor runs `npm run seed` to build it.
