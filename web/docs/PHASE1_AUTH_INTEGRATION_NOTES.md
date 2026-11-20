# Phase 1 Auth Integration Notes (For Backend / Vasant)

**Scope:** `FE-01` Phase 1 aligned the React frontend (`web/`) with the Express backend authentication implementation in `AI-FASHION-OTD/src/modules/auth/`. Backend code was not modified.

---

## 1. Current Verified Contract Aligned by Frontend

- **Base URL Prefix:** `/api` (matching `app.use("/api/auth", authLimiter, authRoutes)` in `AI-FASHION-OTD/src/app.ts`).
- **Endpoints Consumed:**
  - `POST /api/auth/register` — `{ name, email, password }`
  - `POST /api/auth/login` — `{ email, password }`
  - `POST /api/auth/refresh` — relies on `HttpOnly` `refreshToken` cookie (`credentials: 'include'`)
  - `POST /api/auth/logout` — clears cookie and revokes refresh token in database
- **Normalized Response Envelope:** Frontend `auth.adapter.ts` reads the current flat response `{ success, message, user, accessToken }` directly (and tolerates nested `{ data: { user, accessToken } }` defensively if ever wrapped later).
- **Token Handling:**
  - Short-lived `accessToken` is kept **only in memory** (`src/services/authSession.ts`), never in `localStorage` or `sessionStorage`.
  - Refresh token stays inside the backend's `HttpOnly` cookie and is never stored or read by frontend JavaScript.
  - Session restoration on page load runs single-flight `POST /api/auth/refresh` with `credentials: 'include'` (coordinating cleanly with React 19 `StrictMode` and rotating refresh tokens).

---

## 2. Production Cookie & CORS Requirements for Vasant

When deploying to production or staging:

### A. Same-Origin Proxy Setup (Recommended)
If frontend (`/`) and backend (`/api/*`) are served behind the same domain / reverse proxy (matching the local `vite.config.ts` `/api` proxy):
- Backend's current `refreshCookieOptions` (`httpOnly: true`, `secure: isProduction`, `sameSite: "strict"`, `path: "/api/auth"`) work directly with `credentials: "include"`.
- Ensure Express trusts the reverse proxy (`app.set("trust proxy", 1)`) so `secure: true` cookies and `express-rate-limit` client IPs behave accurately behind HTTPS terminators/load balancers.

### B. Cross-Origin Deployment Setup (Separate Domains/Subdomains, e.g., `app.otd.com` & `api.otd.com`)
If the frontend and backend are hosted on separate origins in production or staging:
1. **`FRONTEND_URL` CORS Allowlist (`AI-FASHION-OTD/src/config/cors.ts`):**
   - Currently defaults to `["http://localhost:3000"]`.
   - Set `FRONTEND_URL` to include all active frontend origins (e.g., `https://your-web-domain.com`, and `http://localhost:5173` for direct cross-origin local testing without Vite proxy).
   - Keep `credentials: true` enabled.
2. **Cookie `sameSite` Flag (`AI-FASHION-OTD/src/modules/auth/auth.controller.ts`):**
   - Currently hardcodes `sameSite: "strict"`, which blocks browsers from sending `HttpOnly` cookies on cross-site `fetch(..., { credentials: "include" })` requests between separate domains/ports without a proxy.
   - Cross-origin production deployments require `sameSite: "none"` paired with `secure: true` (HTTPS required). Keep `path: "/api/auth"` and `httpOnly: true`.

---

## 3. Unavailable / Deferred Endpoints (Not Called by Frontend)

- `GET /api/auth/me` — Does not exist on backend; initial session restore uses `POST /api/auth/refresh`.
- `POST /api/auth/forgot-password` — Does not exist on backend; UI clearly marks password recovery as pending backend email reset configuration and makes zero invented network calls.
- **Phone-number auth** — Backend validator enforces strict `email` + `.strict()`; UI accepts email-only credentials.
- **Google / Apple OAuth** — Explicitly disabled with `Coming Soon` state until backend OAuth endpoints are implemented.

