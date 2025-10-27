## Copilot / AI helper instructions — MeetingRoomBooking

Summary
- Monorepo with two parts: backend (Express + MySQL, port 5000) and frontend (React + Vite, port 3000). Root `package.json` runs both with `concurrently`.

Quick facts
- API base: `http://localhost:5000/api` (see `frontend/src/api/axiosInstance.js`).
- Auth: JWT in localStorage under key `mr_token` (see `frontend/src/api/authService.js`). Axios attaches Authorization: `Bearer <token>`.
- DB: MySQL connection pool at `backend/config/db.js` (uses env vars DB_HOST, DB_USER, DB_PASSWORD, DB_NAME).
- Email: uses `nodemailer` in `backend/services/emailService.js` (env vars: EMAIL_USER, EMAIL_PASS).

Where to look (examples)
- Entry points: `backend/server.js`, `frontend/src/main.jsx`.
- Backend patterns: raw SQL via `db.query` from `backend/config/db.js` and model helpers in `backend/models/*` (e.g., `Booking.hasOverlap`, `Booking.createBooking`). See `backend/models/Booking.js` and `backend/controllers/bookingController.js` for booking flow.
- Routes: each resource has a router under `backend/routes/*.js`. Booking endpoints are in `backend/routes/bookingRoutes.js` (notable: `GET /api/bookings/available?room_id=...&date=...`).
- Auth & roles: `backend/middlewares/authMiddleware.js` provides `verifyToken`, `checkAdminRole`, `checkUserRole`. Token payload is attached as `req.user` for controllers.
- Frontend API: wrappers live in `frontend/src/api/services/*.js` (e.g., `bookingService.js`). Use `api` from `frontend/src/api/axiosInstance.js` for network calls.

Conventions & small but important patterns
- Time/overlap logic: Booking overlap uses SQL condition (A_start < B_end) AND (A_end > B_start). See `Booking.hasOverlap` for exact semantics — preserve when modifying.
- Booking statuses: `pending` / `confirmed` are treated as active; many queries filter by these values. Keep exact casing used in DB and code.
- Email errors: `emailService.sendBookingConfirmationEmail` throws on failure; controllers catch and map to 500 with message. If changing email flow, maintain this exception behavior.
- Role checks: admin-only endpoints use `checkAdminRole`. Some user routes call `checkUserRole` but also allow admin — see the middleware logic.
- Token handling: frontend stores token in localStorage and relies on `fetchMe()` to populate `AuthContext`. If you change token key, update `authService`, `axiosInstance`, and `AuthContext` together.

Dev / run commands (use PowerShell)
- Start both services (dev): from repo root
  npm start
- Start backend alone:
  npm run backend
- Start frontend alone:
  npm run frontend
- Frontend build (production):
  cd frontend; npm run build

Env vars to set locally (examples)
- DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
- JWT_SECRET (used by `authMiddleware`)
- EMAIL_USER, EMAIL_PASS (for nodemailer)
- PORT (optional; backend defaults to 5000)

How to add a new API endpoint
1. Add route under `backend/routes/<resource>Routes.js` and register it in `backend/server.js`.
2. Implement the controller in `backend/controllers/<resource>Controller.js` and call model helpers in `backend/models/*`.
3. If DB access is needed, use `backend/config/db.js` pool and prefer parameterized queries (`?`).
4. If protected, use `verifyToken` and `checkAdminRole`/`checkUserRole` appropriately.
5. Add frontend API wrapper in `frontend/src/api/services/` using `api` from `frontend/src/api/axiosInstance.js`.

Notes for AI/codegen
- Preserve SQL logic and status strings exactly; tests / UI depend on them.
- Avoid changing token storage or header names without updating `authService` and `axiosInstance` together.
- Use files listed above as canonical references when generating controllers, models, or front-end API calls.

If anything here is unclear or you'd like me to expand a section (e.g., database schema, env examples, or common PR/checklist), tell me which part and I will iterate.
