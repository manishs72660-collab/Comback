# Comeback frontend

React + Vite + Tailwind CSS + React Router + axios frontend for the Comeback daily routine tracker.

## Run it

```bash
npm install
cp .env.example .env      # set VITE_API_URL to your backend (default http://localhost:3000)
npm run dev               # opens on http://localhost:5173
```

Start the backend first (`node index.js`) so login and data work.

## Backend requirements

- CORS origin must be exactly `http://localhost:5173` (no trailing slash) with `credentials: true`.
- The app uses your httpOnly cookie auth (`/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`).
  When an access token expires, axios calls `/auth/refresh` once and retries the request.
- Routes used: `/dashboard`, `/routines`, `/logs/day`, `/logs/history`, `PUT /logs`.

## Pages

| Route | Page |
|---|---|
| `/login`, `/register` | Auth |
| `/` | Today: progress bar, streak, week strip, today's checklist, 4-month grid, recent days |
| `/routines` | Add, edit, pause, delete and filter routines |
| `/history` | Month calendar; open any day to view or fix its logs (`?date=YYYY-MM-DD`) |
| `/profile` | Streak numbers, theme switch, log out |

## Structure

```
src/
  api/          axios instance (refresh + retry) and API helpers
  context/      AuthContext, ThemeContext
  components/   Layout, RoutineCard, RoutineFormModal, DayBar, Heatmap, WeekStrip, Modal, ...
  pages/        Login, Register, Dashboard, Routines, History, Profile, NotFound
  utils/        date helpers (local YYYY-MM-DD), constants
```

Dates are always sent as the user's local `YYYY-MM-DD`, so the streak follows the user's own day.
Animations respect the "reduce motion" system setting.
