# OTD (Outfit Of The Day) — Web Frontend

> **"YOUR STYLE. EVERY PLACE."**  
> React + TypeScript editorial web atelier and client workspace for OTD — smart wardrobe cataloging, interactive outfit curation preview, saved looks management, and styling preferences.

---

## 1. Project Overview

The `web/` workspace is the OTD browser client, designed to deliver two cohesive experiences inside one single-page application:

1. **Public Editorial Landing (`/`):** Brand introduction, four-step walkthrough (`#how-otd-works`), interactive atelier demo simulator, capsule wardrobe preview, gap intelligence visualization preview, editorial lookbook, and Android beta availability notice.
2. **Atelier Studio (`/home`, `/closet`, `/stylist`, `/saved`, `/shopping`, etc.):** Protected interactive wardrobe workbench accessible either through an authenticated account or via **Guest Demo Mode** (`StudioRouteGuard`).

From an architectural standpoint, the frontend separates transport contracts (`src/types/api/`), normalized client domain types (`src/types/domain/`), pure mappers (`src/adapters/`), centralized HTTP/session management (`src/services/api/`, `src/services/authSession.ts`), account-scoped browser persistence (`src/utils/authStorage.ts`, `src/utils/draftStorage.ts`), and React UI state (`src/context/`, `src/components/`).

---

## 2. Technology Stack

| Category | Package | `package.json` Range | Installed Version | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **UI Framework** | `react`, `react-dom` | `^19.2.8` | `19.3.1` | Component rendering & React 19 UI architecture |
| **Routing** | `react-router-dom` | `^7.18.5` | `7.18.5` | Client-side SPA routing & modal background routes |
| **Styling** | `tailwindcss`, `@tailwindcss/vite` | `^4.3.3` | `4.3.3` | Tailwind CSS v4 utility styling & custom dark-mode variant |
| **Icons** | `lucide-react` | `^1.58.0` | `1.58.0` | UI icon system |
| **Build Tool** | `vite`, `@vitejs/plugin-react` | `^8.3.0`, `^6.1.1` | `8.3.4`, `6.1.2` | Dev server, `/api` proxy, and Rollup/Rolldown bundling |
| **Type Checking** | `typescript`, `@types/node` | `~6.0.2`, `^24.13.3` | `6.0.3`, `24.13.3` | Strict static type checking (`"strict": true`) |
| **Linting** | `oxlint` | `^1.81.0` | `1.88.0` | Fast JS/TS/React static analysis |

> **Note:** `@tailwindcss/vite` and `tailwindcss` are currently listed under `dependencies` rather than `devDependencies` in `web/package.json`. No dedicated test runner (`vitest`, `jest`, `playwright`) is installed in `web/package.json`.

---

## 3. Features

### Authentication, Onboarding & Guest Mode
- **Authentication Modal (`/login`, `/register`):** Email + password sign-in and registration backed by `POST /api/auth/login` and `POST /api/auth/register`. Password reset and social OAuth buttons remain explicitly marked as unavailable/coming soon until backend endpoints exist.
- **Session Handling (`authSession.ts`):** Access tokens stay strictly in module memory; refresh relies on `HttpOnly` cookies via `POST /api/auth/refresh` with single-flight deduplication across React `StrictMode` mounts.
- **Guest Demo Mode (`StudioRouteGuard.tsx`, `GuestRegistrationPromptModal.tsx`):** Visitors can explore the Studio using curated sample items (`INITIAL_CLOSET`) while personal-data actions from public entry points or protected saves prompt account creation.
- **3-Step Onboarding (`/onboarding`, `OnboardingModal.tsx`):** Captures wardrobe focus, style personas, optional height/weight (`cm` / `ft/in`, `kg` / `lbs`) + fit/body silhouette preferences, and optional avatar setup.

### Digital Closet & Multi-Mode Upload Intake
- **Digital Closet (`/closet` in `AppStudio.tsx`):** Searchable active & archived garment tabs, category filters (`tops`, `bottoms`, `outerwear`, `footwear`, `accessories`), formality tier filters (`1`–`5`), sorting, detailed inspection modal, and [`EditPieceModal.tsx`](src/components/EditPieceModal.tsx) editing/discard confirmation.
- **Upload & Intake (`/closet/add` in `ClosetUploadView.tsx`):** Multi-file library upload, live `getUserMedia` camera capture, manual spec entry, and preset starter pieces. Includes MIME/5 MB validation (`garmentValidation.ts`), canvas JPEG compression on white backdrop (`imageCompressor.ts`), duplicate detection (`duplicateDetector.ts`), and auto-saved draft recovery with failure alert and **Retry Save**.

### AI Stylist, Outfit Results & Saved Looks
- **Landing Atelier Simulator (`InteractiveStylist.tsx`) & Hero Prompt Bar (`Hero.tsx`):** Interactive preview showcase clearly labeled as a local demo preview.
- **3-Step Studio Stylist (`/stylist`):** Destination/occasion picker, mood & constraint builder (`GarmentConstraintsSection.tsx`), generation transition (`OutfitGenerationLoader.tsx`), and local ensemble synthesis (`outfitSynthesizer.ts`).
- **Outfit Results & Garment Swap:** Score display (`OutfitResultHeader.tsx`) without artificial minimum-score inflation, rationale card (`OutfitRationaleCard.tsx`), keyboard-navigable SVG flat-lay/mannequin view (`AvatarOutfitCanvas.tsx`), slot breakdown (`OutfitSlotsList.tsx`), single-slot replacement (`GarmentSwapModal.tsx`), and action bar (`OutfitActionToolbar.tsx`).
- **Saved Looks (`/saved` & `savedLooksStorage.ts`):** Local bookmarking, deduplication by slot signature, favorite toggling, deletion, and restoring looks into Stylist Step 3.

### Secondary Workspace Views, Profile & Settings
- **Shopping List (`/shopping` in `ShoppingListView.tsx`):** Wardrobe-gap suggestions and shopping tracker stored locally.
- **Profile (`/profile` in `UserProfileModal.tsx`) & Settings (`SettingsModal.tsx`):** Light/Dark theme switcher (`otd_theme`), Metric (`cm`/`kg`) ↔ Imperial (`ft/in`/`lbs`) measurement unit synchronization across Onboarding and Profile via `otd:settings-updated`, alert toggles, and full local workspace cache reset.
- **Preview Views (`/destinations`, `/calendar`, `/ideas`, `/tryon`):** Client-side UI previews for destination styling, calendar planning, style inspiration, and virtual try-on.

---

## 4. Project Structure

```text
web/
├── index.html                  # HTML entry, Google Fonts, viewport & page metadata
├── package.json                # Dependencies & npm scripts (dev, build, lint, preview)
├── vite.config.ts              # Vite plugins (React + Tailwind v4) & /api proxy target
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # App compiler config (strict: true, ES2023, bundler)
├── tsconfig.node.json          # Vite config TypeScript settings
├── .oxlintrc.json              # Oxlint plugins (react, typescript, oxc) & rules
├── .env.example                # Documented frontend environment variables
├── public/
│   ├── favicon.svg             # Browser icon
│   └── otd_logo.png            # OTD emblem asset
├── docs/                       # Audit & architecture documentation
└── src/
    ├── main.tsx                # React 19 root mount + BrowserRouter
    ├── App.tsx                 # Top-level routes, lazy code-splitting, route/modal state
    ├── index.css               # Tailwind v4 setup, @custom-variant dark, CSS theme tokens
    ├── adapters/               # Pure wire DTO <-> domain normalization & mappers (11 files)
    ├── components/             # Landing sections, modals, views & Studio orchestrator
    │   ├── auth/               # StudioRouteGuard & GuestRegistrationPromptModal
    │   └── ui/                 # Stylist canvas, modals, mobile bottom nav, toolbars
    ├── context/                # ThemeContext, AuthContext (+ instance), ClosetContext
    ├── hooks/                  # useAuth hook
    ├── services/               # apiClient singleton, authSession mutex, auth & outfit services
    │   └── api/                # HTTP transport, error classifier, request/meta helpers
    ├── types/
    │   ├── api/                # Backend/AI wire DTO definitions (10 files)
    │   └── domain/             # Clean frontend domain interfaces (10 files)
    └── utils/                  # Scope storage, IndexedDB drafts, validation, measurements, synthesizer
```

---

## 5. Prerequisites

- **Node.js:** `20.x` LTS or newer recommended (`package.json` does not set `"engines"`; verified locally on **Node.js `v26.3.0`**).
- **npm:** `10.x` or newer recommended (verified locally on **npm `11.12.1`**).
- **Optional Local Backend:** For live authentication and `/api` requests, run the OTD Express/MongoDB backend on `http://127.0.0.1:5000` (or point `VITE_PROXY_TARGET` / `VITE_API_BASE_URL` to your running API instance).

---

## 6. Installation

```bash
# 1. Clone the repository and check out the active integration branch
git clone <repository-url>
cd OTD-Balaji

# 2. Enter the frontend workspace
cd web

# 3. Install dependencies from package-lock.json
npm install
```

---

## 7. Environment Configuration

Copy `.env.example` to `.env` (or `.env.local`) inside `web/` if you need to override defaults. Keep real `.env` files untracked and never store secrets in `VITE_*` variables (Vite bundles `VITE_*` values into client assets).

| Variable | Default | Where Used | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `/api` | [`src/services/api/apiClient.ts`](src/services/api/apiClient.ts) | Base URL prefix used by `apiClient` and `authService`. Defaults to `/api` for Vite proxy or same-origin deployments. |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:5000` | [`vite.config.ts`](vite.config.ts) | Local development proxy target for `/api/*` requests during `vite` / `vite preview`. |

---

## 8. Development Commands

Run all commands from inside `web/`:

| Command | Script / Tool | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local Vite dev server with HMR and `/api` proxy |
| `npm run build` | `tsc -b && vite build` | Compiles project references and emits production assets into `dist/` |
| `npm run lint` | `oxlint` | Runs `react`, `typescript`, and `oxc` lint rules across `web/src/` |
| `npm run preview` | `vite preview` | Serves the built `dist/` bundle locally |

Additional strict TypeScript check (used during verification):

```bash
npx tsc -p tsconfig.app.json --strict --noEmit
npx tsc -p tsconfig.node.json --noEmit
```

---

## 9. Routing and Navigation

Defined in [`src/main.tsx`](src/main.tsx) (`BrowserRouter`) and [`src/App.tsx`](src/App.tsx):

| Path Pattern | Guard / Behavior | Rendered View |
| :--- | :--- | :--- |
| `/` | Public | Editorial landing page + lazy `ApkModal` & `LegalModal` |
| `/login`, `/register` | Public overlay modal (`Redirect` to `/home` or `redirectTo` if already authenticated) | `AuthModal` over background route |
| `/onboarding` | Public overlay modal (`backgroundLocation` defaults to `/`) | `OnboardingModal` 3-step profile wizard |
| `/profile` | Requires `canAccessStudio` (`authenticated` or `guest`) via `StudioRouteGuard` | `UserProfileModal` over studio route |
| `/home`, `/closet`, `/closet/add`, `/stylist`, `/saved`, `/shopping`, `/destinations`, `/calendar`, `/ideas`, `/tryon` | Protected by `StudioRouteGuard` (`authenticated` or `guest` demo) | Lazy `AppStudio` shell + `MobileBottomNav` (`< 768px`) & `Sidebar` (`>= 768px`) |
| `*` | Catch-all | [`NotFoundView`](src/components/NotFoundView.tsx) |

---

## 10. State Management and Storage

### React Context Providers
1. **`ThemeProvider` (`src/context/ThemeContext.tsx`):** Stores `otd_theme` (`light` \| `dark`, default `light`) in `localStorage` and synchronizes `.dark` / `.light` classes and `data-theme` on `<html>`.
2. **`AuthProvider` (`src/context/AuthContext.tsx`):** Tracks `'initializing' | 'authenticated' | 'guest' | 'unauthenticated'`. Coordinates `authSession.ts` events (`onSessionRefreshed`, `onSessionInvalidated`), guest sessions, and private cache cleanup.
3. **`ClosetProvider` (`src/context/ClosetContext.tsx`):** Holds wardrobe items, profile, saved/liked looks, shopping list, and stylist session state under the active workspace scope (`authenticated:<userId>`, `guest`, or `none`).

### Client Persistence Isolation (`authStorage.ts` & `draftStorage.ts`)
- **Authenticated Private Namespace:** Stored under `otd_private:<userId>:<resource>` in `localStorage` and `auth_intake_session:<userId>` in IndexedDB (`otd_intake_db` / store `garment_drafts`). Scrubbed on `logout()`, `enterGuestMode()`, session invalidation, or account switch (`User A -> User B`).
- **Guest Demo Namespace:** Stored under guest keys (`otd_closet_items`, `otd_user_profile`, `otd_shopping_list`, `otd_saved_looks`, `otd_liked_looks`, `otd_intake_draft_fallback`) with `otd_guest_demo_active` in `sessionStorage` and IndexedDB key `active_intake_session`.
- **IndexedDB Fallback Behavior:** If IndexedDB fails or is unavailable, `draftStorage.ts` persists garment metadata (omitting heavy photo DataURLs to respect `localStorage` limits) under scoped `intake_draft_fallback`; if both fail, `ClosetUploadView` surfaces a visible `role="alert"` error banner with **Retry Save**.
- **Shared UI Preferences:** `otd_theme` and `otd_user_settings` persist across sessions unless cleared via `Reset Local Data`.

---

## 11. Backend and AI Integration

### Implemented / Wired Today
- **Authentication HTTP Client (`auth.service.ts`, `apiClient.ts`):** Live `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh` (with `credentials: 'include'`), and `POST /api/auth/logout`, plus single-flight `401` refresh-and-retry recovery.
- **Guarded Outfit Delete Hook (`outfits.service.ts`):** `deleteBackendOutfitForLook()` enforces 24-hex MongoDB ObjectId validation (`resolveSavedLookIdentifier`) before issuing `DELETE /api/outfits/:id`; local demo IDs never make network requests.
- **WS7 Contracts (`src/types/api/`, `src/types/domain/`, `src/adapters/`):** Strongly typed DTOs, domain models, and normalization adapters (`wardrobe.adapter.ts`, `profile.adapter.ts`, `outfit.adapter.ts`, `savedLook.adapter.ts`, `ai.adapter.ts`, etc.) prepared for backend integration.

### Simulated / Demo / Pending Backend Integration
The following areas operate locally in the browser and await Express/MongoDB or AI/ML service wiring:
- **Digital Closet CRUD & Image Streaming (`wardrobe.service.ts` not yet wired):** Closet items persist locally in `localStorage`; `GET /api/wardrobe/:id/image` retrieval and `POST /api/wardrobe/recognize` auto-tagging are pending backend routes.
- **AI Stylist Engine & Chat:** Outfit synthesis (`outfitSynthesizer.ts`), scoring rationale, and concierge replies run deterministically/locally in the client rather than calling `AI_SERVICE_URL`.
- **Saved Looks Cloud Sync & Shopping / Calendar / Destinations / Try-On:** Persist locally or render preview UI (`Sample Forecast`, `Demo Preview`, `AI Cloud Roadmap`).
- **Deferred Auth & Mobile Distribution:** Forgot-password reset, Google/Apple OAuth, and downloadable `.apk` package (`Early Beta · Coming Soon`) are intentionally non-network placeholders.

---

## 12. Responsive Design and Accessibility

Verified in headless Chromium against production `vite preview` builds:
- **Responsive Viewports:** `0px` horizontal overflow and `0` broken visible images verified across `8` viewports (`320×640`, `360×800`, `375×667`, `390×844`, `430×932`, `768×1024`, `1024×768`, `1440×900`) across `/` and Studio routes (`72 / 72` checks), plus `320×640` overflow checks for `SettingsModal`, `UserProfileModal`, and `OnboardingModal` (Steps 1–3).
- **Theme Polarity:** Class-based `@custom-variant dark (&:where(.dark, .dark *));` in [`src/index.css`](src/index.css) verified across Light/Dark modes independent of OS theme preference.
- **Keyboard & Focus Management:** Universal [`useFocusTrap`](src/utils/focusTrap.ts) with `Escape` closing, nested modal pausing, reference-counted `acquireBodyScrollLock()` across stacked dialogs, and `isConnected` focus restoration checks.
- **Semantics, Contrast & Motion:** Native `<button type="button">` controls (no nested interactive elements), paired `<label htmlFor>` fields, `>= 44px` route-guard return target, WCAG AA selected-state contrast fixes on modals/pills, keyboard-navigable `<svg role="group">` hotspots in [`AvatarOutfitCanvas.tsx`](src/components/ui/AvatarOutfitCanvas.tsx), and `@media (prefers-reduced-motion: reduce)` fallbacks in [`src/index.css`](src/index.css).

---

## 13. Build and Troubleshooting

### Production Build & Preview
```bash
cd web
npm run lint
npx tsc -p tsconfig.app.json --strict --noEmit
npx tsc -p tsconfig.node.json --noEmit
npm run build
npm run preview
```

### Common Troubleshooting & Known Limitations
- **`ECONNREFUSED` or proxy errors on `/api/auth/*`:** Ensure the backend server is listening on `VITE_PROXY_TARGET` (default `http://127.0.0.1:5000`), or use **Guest Demo Mode** (`Explore Web Studio`) for local UI exploration.
- **IndexedDB blocked in private browsing / restricted environments:** Draft intake automatically falls back to metadata-only `localStorage` (`imagesPreserved: false`). If storage quota is also exceeded, use **Retry Save** or free browser storage via Settings -> **Reset Local Data**.
- **Large studio component chunks:** [`AppStudio.tsx`](src/components/AppStudio.tsx), [`ClosetUploadView.tsx`](src/components/ClosetUploadView.tsx), and [`ShoppingListView.tsx`](src/components/ShoppingListView.tsx) are lazy-loaded via `React.lazy`, though the modules themselves remain large multi-view files scheduled for future decomposition.
- **Cross-origin cookie issues in deployed environments:** When serving the frontend and backend on separate domains/origins, ensure backend CORS allowlists (`FRONTEND_URL`) and `HttpOnly` refresh cookie settings (`SameSite=None; Secure`) are configured; otherwise deploy behind a same-origin `/api` reverse proxy.

---

## 14. Team Responsibilities

- **Piyush:** Frontend development, UI/UX implementation, state isolation, accessibility, responsive polish, and client API/adapter preparation.
- **Vasant:** Backend development and API integration (Express/MongoDB/GridFS routes, validators, cookies, CORS, and domain endpoints).
- **Vyshnavi:** AI integration (garment recognition, AI stylist pipeline, conversational refinement, and virtual try-on services).
- **Balaji:** Reusable components and frontend QA (end-to-end live-backend verification and automated smoke coverage).
- **Mustafa:** Product and UX direction.
- **Ali:** Founder and overall product direction.

---

## 15. Current Project Status

- **Frontend Readiness:** All Phases 1–5, Priority 1 (isolation, contrast, honest harmony score, modal/SVG a11y), and Priority 2 (measurement sync/validation, image pre-validation & JPEG backdrop, visible draft failure retry, `profile.adapter` category normalization, ref-counted scroll locks, `320px` responsive polish, and transparent demo/roadmap messaging) items are complete and verified (`tsc --strict`: `0` errors, `oxlint`: `0` errors, `vite build`: clean, `72/72` Chromium viewport/route checks passing). See [`docs/OTD_COMPLETE_WEB_AUDIT_REPORT.md`](docs/OTD_COMPLETE_WEB_AUDIT_REPORT.md) and [`docs/FRONTEND_CODEBASE_INVENTORY.md`](docs/FRONTEND_CODEBASE_INVENTORY.md).
- **Remaining Integration Dependencies:** Live Express/MongoDB runtime on `:5000` (`connect ECONNREFUSED 127.0.0.1:5000` during local frontend verification), wardrobe/profile/outfit/shopping/calendar service wiring, live AI recognition & styling integration, and end-to-end QA on the integrated stack.
