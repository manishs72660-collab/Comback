# Comeback frontend

React + Vite + Tailwind CSS + React Router + axios frontend for the Comeback daily routine tracker.
Two themes (dark and white), hairline borders, no shadows, one amber accent on the streak number.

## Run it

```bash
npm install
cp .env.example .env      # set VITE_API_URL (local: http://localhost:3000)
npm run dev               # http://localhost:5173
npm run build             # production build in dist/
```

## Deploy on Vercel

`vercel.json` already rewrites every path to `index.html`, so refreshing `/routines` or `/history` works.
In the Vercel project settings add the environment variable `VITE_API_URL` (your Render URL).

## Backend requirements

- Auth uses httpOnly cookies (`/auth/login`, `/auth/refresh`, `/auth/me`, `/auth/logout`, `/auth/register`).
  When an access token expires, axios calls `/auth/refresh` once and retries the request.
- CORS: `origin` must be exactly your frontend URL (no trailing slash) with `credentials: true`.
  Allow `http://localhost:5173` for local work and your Vercel URL for production.
- Frontend on Vercel and API on Render are different sites, so the auth cookies must be set with
  `SameSite=None; Secure` (and `app.set("trust proxy", 1)` on Express behind Render).
- Routes used: `/dashboard`, `/routines`, `/logs/day`, `/logs/history`, `PUT /logs`.

## Look and feel

Dark and white themes with one amber accent (streak, progress ring, ticks, calendar).
Floating pill navigation on desktop, floating dock on mobile. Cards, rounded shapes, soft motion
(entrance reveal, progress ring, tick pop, drawer slide). Motion respects "reduce motion".

| Where | Font |
|---|---|
| Today headline, login headline, wordmark | Dancing Script |
| Everything else | Geist (Inter as fallback) |

Fonts load from the Google Fonts link in `index.html`.
Colours are CSS variables in `src/index.css` (`:root[data-theme="dark" | "light"]`) and are mapped to
Tailwind names in `tailwind.config.js`: `bg`, `panel`, `panel2`, `ink`, `muted`, `line`, `accent`, `danger`.
Edit them there to retheme the whole app.

## Pages

| Route | Page |
|---|---|
| `/login`, `/register` | Auth: dark hero with floating previews, form on the right |
| `/` | Today: hero with progress ring, routines by time of day, streak card, 30-day stat, heatmap, recent days |
| `/routines` | Routine cards with filters; add and edit in a floating right-side drawer |
| `/history` | Coloured month calendar, month stats, selected-day checklist (`?date=YYYY-MM-DD`) |
| `/profile` | Avatar, streak stats, Dark / White switch, log out |

## Structure

```
src/
  api/          axios instance (refresh + retry) and API helpers
  context/      AuthContext, ThemeContext (sets data-theme and the dark class)
  components/   Layout (sidebar / bottom bar), Modal (dialog + drawer), RoutineCard, RoutineFormModal,
                DayBar, WeekStrip, Heatmap, StatusDot, AuthShell, Field, ...
  pages/        Login, Register, Dashboard, Routines, History, Profile, NotFound
  utils/        date helpers (local YYYY-MM-DD), constants
```

Dates are always sent as the user's local `YYYY-MM-DD`, so the streak follows the user's own day.
Motion only responds to the user (tick, drawer, theme switch) and respects "reduce motion".
