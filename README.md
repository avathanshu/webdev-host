# CabsOnline — Part 2 README

## 1. Public URL

The application can be run locally (see Section 3). To deploy publicly, push to any Node.js hosting provider (Render, Railway, Fly.io) and set `PORT` accordingly.

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 with Vite 5 |
| Routing | React Router DOM 6 |
| Styling | Custom CSS (CSS variables, no UI library) |
| Build tool | Vite 5 (dev proxy + production build) |
| Backend | Node.js + Express 4 |
| Data persistence | JSON file (`server/db.json`) — zero native dependencies |
| Font | DM Serif Display + DM Sans (Google Fonts) |

---

## 3. How to Run Locally

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Install server dependencies (from project root)
npm install

# 2. Install client dependencies
cd client && npm install && cd ..

# 3. Build the React app
cd client && npm run build && cd ..

# 4. Start the server (serves both API and built React app)
npm start
# → Open http://localhost:3001
```

**Development mode** (hot-reload React + live server):

```bash
# Terminal 1 — backend
npm start

# Terminal 2 — frontend dev server with proxy
cd client && npm run dev
# → Open http://localhost:5173
```

The Vite dev server proxies `/api/*` requests to `http://localhost:3001`.

---

## 4. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/booking` | Create a new booking |
| POST | `/api/admin/search` | Search by BRN or return upcoming unassigned (2h) |
| POST | `/api/admin/assign` | Assign next available driver to a booking |
| GET | `/api/admin/all` | Return all bookings (newest first) |
| GET | `/api/drivers` | List all drivers and their status |
| GET | `/api/driver/:driverID/jobs` | Return all jobs for a specific driver |
| POST | `/api/driver/:driverID/complete` | Mark a job as completed |
| GET | `/api/track/:brn` | Get booking status by BRN |

All responses are JSON.

---

## 5. Feature Descriptions

### 5.1 Booking Page (`/`)
Mirrors the Part 1 booking form. Passengers enter their name, phone, pickup address, and pickup date/time. Client-side validation runs before submission. On success, a confirmation box displays the BRN, pickup time, and pickup date with a link to the Track page.

### 5.2 Track Page (`/track`) *(new)*
Customers enter their BRN to see the full booking details and a visual four-stage timeline:
- **Booking Received** → **Awaiting Assignment** → **Driver Assigned** → **Trip Completed**

The timeline highlights the current stage with colour coding and marks completed stages with a tick.

### 5.3 Admin Dashboard (`/admin`) *(extended from Part 1)*
Two tabs:
- **Search / Assign:** Replicates Part 1 admin behaviour — search by BRN or see upcoming unassigned bookings within 2 hours. Clicking Assign selects the first available driver automatically and displays a confirmation message.
- **All Bookings:** A full reverse-chronological table of every booking, with live refresh. Unassigned rows also expose an Assign button here.

### 5.4 Driver Portal (`/driver`) *(new)*
Drivers select their profile from a roster of four pre-seeded drivers. The portal shows:
- **Active Jobs:** Cards for each currently assigned booking with pickup address, destination, and date/time. A "Mark Complete" button updates the booking to `completed` and returns the driver to `available` status.
- **Completed Jobs:** A history table of past trips.

---

## 6. Testing Instructions

### Example booking references
After creating bookings they will be numbered sequentially: `BRN00001`, `BRN00002`, etc.

### Sample driver IDs
| ID | Name |
|----|------|
| DRV001 | James Taufa |
| DRV002 | Priya Sharma |
| DRV003 | Mark Chen |
| DRV004 | Aotea Williams |

### End-to-end test flow
1. Go to **Book** — submit a booking with a pickup time within the next 2 hours. Note the BRN.
2. Go to **Track** — paste the BRN. Status should show "Awaiting Assignment".
3. Go to **Admin → Search / Assign** — leave the search field empty and click Search. The booking should appear. Click **Assign**.
4. Go to **Track** again — status should now show "Driver Assigned" with the driver name.
5. Go to **Driver** — select the assigned driver. The booking should appear under Active Jobs. Click **Mark Complete**.
6. Go to **Track** once more — status shows "Trip Completed" with all four stages ticked.

---

## 7. Limitations and Known Issues

- **Persistence:** Data is stored in `server/db.json`. Deleting this file resets all bookings and returns drivers to available status. This is intentional for easy demo resets.
- **Driver assignment:** The assign action picks the first available driver in list order. A production system would use proximity data.
- **Authentication:** No login is required for Admin or Driver pages. This matches the Part 1 spec note ("authentication is not required").
- **Concurrent writes:** The JSON file store uses synchronous read-modify-write, which is safe for single-user demos but not suitable for concurrent production traffic.
- **BRN uniqueness:** BRN generation counts total rows. If bookings are manually deleted from `db.json` and a new booking is created, the BRN could collide. For demos this is not an issue.

---
