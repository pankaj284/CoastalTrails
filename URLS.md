# Coastal Trails — Quick Access URLs & Portals

Use this reference to quickly access all running services, portals, and external dashboards.
Pre-made Windows desktop shortcut (`.url`) files are also available in the [`shortcuts/`](./shortcuts/) folder.

---

## 1. Local Web Applications & Portals

| Portal | URL | Description | Credentials / Notes |
|---|---|---|---|
| **Traveler App (Dev)** | http://localhost:3000 | Vite live development server (Hot Module Reload) | Active client workspace |
| **Trails & Culture Journal** | http://localhost:3000/trails | "The Gokarna Journal" editorial magazine page | Active redesign page |
| **Explore Stays** | http://localhost:3000/explore | Traveler stay browsing & 20% hold reservation | 12 curated stays |
| **Database Studio (Web)** | http://localhost:3000/db-studio | Visual database management interface | Direct DB inspection |
| **Traveler App (Preview)** | http://localhost:4173 | Production build preview server (`vite preview`) | Built from `dist/` |
| **Admin Console** | http://localhost:3002 | Coastal Trails PMS & Room Management Portal | Phone: `+919000000000`<br>Password: `admin@123` |

---

## 2. Backend REST API (`:5000`)

| Endpoint | URL | Description |
|---|---|---|
| **API Health Check** | http://localhost:5000/api/health | Server uptime, timestamp, and active endpoints |
| **Live Database Stats** | http://localhost:5000/api/db/stats | Real-time counts for homestays, bookings, users |
| **Homestays List** | http://localhost:5000/api/homestays | JSON feed of all 12 properties with pricing & amenities |
| **Bookings API** | http://localhost:5000/api/bookings | Active booking reservations & hold statuses |

---

## 3. Production & External Services

| Service | URL | Notes |
|---|---|---|
| **Live Production Website** | https://coastaltrails.in | Live public domain |
| **Razorpay Dashboard** | https://dashboard.razorpay.com | Live payment gateway monitoring |
| **Gmail Webmail** | https://mail.google.com | Booking inbox (`bookings@coastaltrails.in`) |

---

## 4. One-Click Windows Shortcuts

The [`shortcuts/`](./shortcuts/) folder contains double-clickable `.url` files that open directly in your browser. You can right-click any of them to **"Pin to Start"** or drag them to your desktop/taskbar:
- `shortcuts/Traveler-App-Dev-3000.url`
- `shortcuts/Trails-and-Culture-3000.url`
- `shortcuts/Traveler-App-Preview-4173.url`
- `shortcuts/Admin-Console-3002.url`
- `shortcuts/Backend-API-Health-5000.url`
- `shortcuts/Database-Stats-5000.url`
- `shortcuts/Live-Site-coastaltrails.url`
