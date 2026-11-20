# OTD (Outfit Of The Day) — Complete Frontend Codebase Inventory & Integration Readiness Audit

**Audit Date:** November 12, 2026  
**Workspace Audited:** `web/`  
**Git Branch:** `integrate/frontend-into-main`  
**HEAD Commit Audited:** `4ae9f4e` (`feat(frontend): add guest mode and account-scoped workspace`)  
**Scope:** Strictly read-only technical inventory & API integration readiness assessment for founder/leadership handover and engineering planning. Zero application source files, configs, dependencies, or mock datasets were modified.

---

## Executive Readiness Summary

| Dimension | Current State | Summary |
| :--- | :--- | :--- |
| **Application Shell & UX** | **Implemented** | Complete React 19 + TypeScript + Vite 8 editorial SPA with public landing showcase, Studio dashboard, Digital Closet, Upload wizard, Interactive AI Stylist wizard, Wishlist, Calendar, Destinations, Saved Looks, Ideas, Virtual Try-On preview, light/dark theming, and keyboard-accessible focus-trapped modals. |
| **Authentication & Session Isolation** | **Implemented (Wired)** | Memory-only `accessToken`, `HttpOnly` cookie refresh (`credentials: 'include'`), single-flight refresh mutex (`authSession.ts`), React StrictMode bootstrap deduplication, epoch invalidation, and strict per-user namespace isolation (`otd_private:<userId>:*` / `auth_intake_session:<userId>`). |
| **Guest Demo Mode & Feature Gating** | **Implemented** | Guests can explore sample garments, curated saved looks, public landing, and preview flows without registering (`StudioRouteGuard`, `GuestRegistrationPromptModal`), while personal mutations (closet upload/edit/delete/archive, personal outfit generation/save, wishlist mutations, profile save) trigger registration prompts. |
| **Centralized HTTP Client & Contracts** | **Implemented (Partially Wired)** | Centralized `apiClient` (`src/services/api/`) handles timeouts, proxy failure detection, `FormData` multipart support, and single-flight 401 refresh recovery. Complete API DTOs (`10` files), domain models (`10` files), and adapters (`11` files) exist, but **only `/api/auth/*` and a guarded dead-code `DELETE /api/outfits/:id` hook are wired**. |
| **Backend Domain Integration** | **Backend-Dependent / Simulated** | Wardrobe CRUD & image streaming, AI recognition, Stylist pipeline & chat, Saved Looks sync, Wishlist CRUD, Profile/Avatar sync, Calendar events, Venues, and Weather remain **local-only** (`localStorage`, IndexedDB, hardcoded fixtures, deterministic client synthesis). |
| **Automated Testing** | **Missing** | **Zero** unit, integration, component, or E2E test suites exist in `web/`. Verification relies on `oxlint`, `tsc -b`, `vite build`, and manual inspection/browser testing. |

---

## 1. Project Inspection (`web/`)

### 1.1 Root Configuration & Top-Level Files
- `web/package.json` — Scripts: `dev` (`vite`), `build` (`tsc -b && vite build`), `lint` (`oxlint`), `preview` (`vite preview`). Declares **no `"engines"` field**.
- `web/package-lock.json` — Lockfile present and aligned with `npm`.
- `web/vite.config.ts` — Enables `@vitejs/plugin-react` and `@tailwindcss/vite`; proxies `/api` -> `VITE_PROXY_TARGET || 'http://127.0.0.1:5000'` (`changeOrigin: true`).
- `web/tsconfig.json`, `web/tsconfig.app.json`, `web/tsconfig.node.json` — Project references split browser app and Vite config. `tsconfig.app.json` targets `ES2023`, `jsx: "react-jsx"`, with `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`, `verbatimModuleSyntax: true`, `noFallthroughCasesInSwitch: true` (note: `"strict": true` is **not** enabled).
- `web/.oxlintrc.json` — Configures `react`, `typescript`, `oxc` plugins with `react/rules-of-hooks: error` and `react/only-export-components: warn`.
- `web/.env.example` — Template containing `VITE_API_BASE_URL` and `VITE_PROXY_TARGET` only. **No `.env` file exists** in `web/`.
- `web/index.html` — Loads Google Fonts (`Alex Brush`, `Cinzel`, `Cormorant Garamond`, `Montserrat`, `Outfit`, `Playfair Display`), `/otd_logo.png`, sets viewport meta tag.
- `web/README.md`, `web/skills-lock.json` — Repository template docs and tooling lockfile.
- Deployment config check: **No** `vercel.json`, `netlify.toml`, `Dockerfile`, `.github/workflows/`, or proxy deployment manifest exists in `web/` or repo root.

### 1.2 Directory Breakdown (`96` files inside `web/src/`)

| Directory | File Count | Contents & Role |
| :--- | :---: | :--- |
| `web/src/` (root) | 4 | `main.tsx`, `App.tsx`, `index.css`, `App.css` |
| `web/src/assets/` | 3 | Static bundled images/SVGs (`hero.png`, `react.svg`, `vite.svg`) |
| `web/src/adapters/` | 11 | `index.ts`, `shared.adapter.ts`, `auth.adapter.ts`, `savedLook.adapter.ts`, `profile.adapter.ts`, `wardrobe.adapter.ts`, `outfit.adapter.ts`, `preferences.adapter.ts`, `shopping.adapter.ts`, `calendar.adapter.ts`, `ai.adapter.ts` |
| `web/src/components/` | 20 | `App.tsx` landing sections (`Navbar`, `Hero`, `InteractiveStylist`, `Pillars`, `WardrobeStudio`, `GapIntelligence`, `Lookbook`, `AppDownload`, `Footer`), studio & workflows (`AppStudio` [4,817 lines], `ClosetUploadView` [2,812 lines], `ShoppingListView` [1,503 lines]), modals (`AuthModal`, `OnboardingModal`, `UserProfileModal`, `EditPieceModal`, `AddPieceModal` [unused], `ApkModal`), fallbacks (`ErrorBoundary`, `NotFoundView`) |
| `web/src/components/auth/` | 2 | `StudioRouteGuard.tsx`, `GuestRegistrationPromptModal.tsx` |
| `web/src/components/ui/` | 15 | `AvatarOutfitCanvas.tsx`, `GarmentConstraintsSection.tsx`, `GarmentSwapModal.tsx`, `LegalModal.tsx`, `MobileBottomNav.tsx`, `NotificationPopover.tsx`, `OccasionModal.tsx`, `OutfitActionToolbar.tsx`, `OutfitGenerationLoader.tsx`, `OutfitRationaleCard.tsx`, `OutfitResultHeader.tsx`, `OutfitSlotsList.tsx`, `SettingsModal.tsx`, `StylistReviewSummary.tsx`, `VenueCategoryModal.tsx` |
| `web/src/context/` | 4 | `AuthContext.tsx`, `AuthContextInstance.ts`, `ClosetContext.tsx` (1,126 lines), `ThemeContext.tsx` |
| `web/src/hooks/` | 1 | `useAuth.ts` |
| `web/src/services/` | 8 | `auth.service.ts`, `auth.types.ts`, `authSession.ts`, `outfits.service.ts`, and `api/` (`api.types.ts`, `apiErrors.ts`, `apiClient.ts`, `index.ts`) |
| `web/src/types/api/` | 10 | `index.ts`, `common.dto.ts`, `auth.dto.ts`, `wardrobe.dto.ts`, `outfit.dto.ts`, `ai.dto.ts`, `profile.dto.ts`, `preferences.dto.ts`, `shopping.dto.ts`, `events.dto.ts` |
| `web/src/types/domain/` | 10 | `index.ts`, `common.ts`, `auth.ts`, `savedLook.ts`, `profile.ts`, `wardrobe.ts`, `outfit.ts`, `preferences.ts`, `shopping.ts`, `calendar.ts` |
| `web/src/utils/` | 8 | `authStorage.ts`, `draftStorage.ts`, `duplicateDetector.ts`, `focusTrap.ts`, `garmentValidation.ts`, `imageCompressor.ts`, `outfitSynthesizer.ts`, `savedLooksStorage.ts` |
| **Total `web/src/`** | **96** | **All TypeScript/TSX/CSS/asset files** |

### 1.3 `web/public/` & `web/docs/` & Tests
- `web/public/` (`3` files): `favicon.svg`, `icons.svg`, `otd_logo.png`.  
  **Missing asset:** `public/fashion_otd_companion.apk` is **absent**, even though `AppDownload.tsx` and `ApkModal.tsx` link directly to `/fashion_otd_companion.apk`.
- `web/docs/` (`5` pre-existing markdown docs): `PHASE1_AUTH_INTEGRATION_NOTES.md`, `PHASE2_API_CLIENT_NOTES.md`, `WS7_CONTRACTS_AND_MIGRATION_MAP.md`, `OTD_DIGITAL_CLOSET_AUDIT.md`, `OTD_SAVED_LOOKS_STYLIST_PROFILE_AUDIT.md` (note: the last two predate `4ae9f4e`; some items listed in them were subsequently fixed in `4ae9f4e`, noted in Sections 5 and 9).
- **Automated Tests:** **None.** Zero `*.test.*` or `*.spec.*` files and no Jest/Vitest/Playwright configuration exist.

### 1.4 Verification Command Results (Run on Current Tree)
- `npm --prefix web run lint` (`oxlint`, 92 source files analyzed): **PASS** — `0` errors, `4` warnings (`react/only-export-components` on `useTheme` in `ThemeContext.tsx:52`, and `findOwnedAlternatives`, `checkGarmentInCloset`, `useCloset` in `ClosetContext.tsx:109,210,1120`).
- `npm --prefix web run build` (`tsc -b && vite build`): **PASS** (exit code `0`) — 1,995 modules transformed; emits Vite >500 kB chunk warning for single unsplit JS bundle (`dist/assets/index-B8DIKZgw.js` ~921.53 kB / 225.43 kB gzip; CSS `113.68 kB`).

---

## 2. All Routes & Pages/Views

Routing is defined in `web/src/App.tsx` using `react-router-dom` v7 (`BrowserRouter` mounted in `web/src/main.tsx`). Studio routes share `StudioLayout` -> `AppStudio` inside `StudioRouteGuard`. Route-driven modals render over `backgroundLocation`.

| Path | Component(s) | Purpose | Auth Req | Guest Access Behavior | Main Interactions | Data Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | `Navbar`, `Hero`, `InteractiveStylist`, `Pillars`, `WardrobeStudio`, `GapIntelligence`, `Lookbook`, `AppDownload`, `Footer`, `ApkModal` | Public landing showcase & interactive preview | Public | Full read/explore access; personal actions (hero curate/chat, save look, add piece, profile) open `GuestRegistrationPromptModal` | Explore stylist presets, inspect sample wardrobe matrix, search/filter sample closet, preview lookbook, launch Studio/Auth/Onboarding/APK modal | `ClosetContext` demo fixtures + hardcoded component arrays + Unsplash URLs | **Simulated** (UI **Implemented**) |
| `/login` | `AuthModal` (`mode="signin"`) | Email/password login + modal route over background | Unauth only (authenticated redirects to `safeRedirectTo`) | Offers `"Explore Web Studio as Guest →"` (`enterGuestMode`) | Email/password validation, login call, network fallback prompt to guest mode, Google/Apple disabled (`Coming Soon`), Forgot Password honest notice panel | Live `POST /api/auth/login` via `authService` | **Implemented** |
| `/register` | `AuthModal` (`mode="signup"`) | New account registration | Unauth only (authenticated redirects to `safeRedirectTo`) | Offers `"Explore Web Studio as Guest →"` | Full name + email + min-8 password validation, registration call | Live `POST /api/auth/register` via `authService` | **Implemented** |
| `/onboarding` | `OnboardingModal` | 3-step Style DNA, measurements & optional avatar preview setup | Accessible public or auth | Can explore steps & `"Skip Setup & Open Closet"` (enters Guest Demo -> `/closet`); photo upload prompts registration; `"Complete & Enter Studio"` writes profile only when authenticated (guests prompted or guided) | Select wardrobe focus, style personas, height/weight/body shape/fit/colors, optional archetype or 5MB reference photo | `ClosetContext.profile` (`localStorage` per-user only) | **Partially Implemented** (local-only; not synced to `/api/profile`) |
| `/profile` | `StudioRouteGuard` -> `UserProfileModal` | Edit Style DNA, wardrobe focus, height, body silhouette, personas, fit | Studio access (`authenticated` or `guest`) | Unauth blocked by `StudioRouteGuard`; Guest can inspect form fields, `"Save Style Preferences"` opens `GuestRegistrationPromptModal` | Edit name/focus/height/bodyShape/personas/fit, simulated 800ms save | `ClosetContext.profile` (`otd_private:<userId>:user_profile`) | **Partially Implemented** (local-only; `UserProfileModal` != `OnboardingModal` options) |
| `/home` | `StudioRouteGuard` -> `AppStudio` (`tab='home'`) | Authenticated/Guest Studio dashboard | `authenticated` or `guest` | Accessible in Guest Demo with curated defaults; omnibar/chips/heart save/upload prompt registration when guest | Search omnibar, suggestion chips, quick action cards, 4 `HOME_SUGGESTION_TEMPLATES` preview/like, static weather card, closet category shortcuts | `HOME_SUGGESTION_TEMPLATES`, `ClosetContext`, hardcoded weather/stats | **Partially Implemented** / **Simulated** |
| `/closet` | `StudioRouteGuard` -> `AppStudio` (`tab='closet'`) | Digital Closet inventory grid & active/archived toggle | `authenticated` or `guest` | Guest sees `INITIAL_CLOSET` (17 pieces); edit, archive, restore, delete, add prompt registration | Category tabs, search (100 chars), active vs archive view toggle, inspect/edit/archive/restore/delete garment | `ClosetContext.closet` (`otd_closet_items` vs `otd_private:<userId>:closet_items`) | **Implemented** (client storage; **Backend-Dependent** for cloud CRUD & images) |
| `/closet/add` | `StudioRouteGuard` -> `AppStudio` -> `ClosetUploadView` (or guest gate screen) | Multi-photo upload, camera capture, compression, metadata editor, IndexedDB draft recovery | **Strict `isAuthenticated`** (`AppStudio` renders guest registration block card instead of upload flow) | Explicitly blocked for guests with CTA to register/sign in or return to `/closet` | Camera capture (`getUserMedia`), multi-file drag/drop (5MB, JPEG/PNG/WebP), Canvas compression (`compressImageFile`), duplicate detection/replace flow, editorial preset templates, IndexedDB draft auto-save/restore, dev QA simulator | `ClosetContext`, IndexedDB (`otd_intake_db`), localStorage fallback, static presets (`PRESET_EDITORIAL_PIECES`) | **Implemented** (local compression & drafts) / **Backend-Dependent** (AI garment recognition & GridFS upload) |
| `/stylist` | `StudioRouteGuard` -> `AppStudio` (`tab='stylist'`) | 3-step AI Stylist wizard & 5-slot ensemble studio | `authenticated` or `guest` (Step 3 gated for non-curated generation) | Guest can browse Steps 1–2 and preview restored `curated-default` saved looks in Step 3; personalized generation, swap, regenerate, save, chat refinement prompt registration | Occasion/Venue selector, Mood/Weather/Geolocation/Preferences/Include-Avoid constraints, `StylistReviewSummary`, 1100ms loader -> deterministic `synthesizeOutfitResult`, 5-slot `AvatarOutfitCanvas`, `GarmentSwapModal`, missing-piece `addToShoppingList`, local chat modifier | `outfitSynthesizer.ts`, `ClosetContext`, `savedLooksStorage.ts`, hardcoded `CURATED_VENUES` | **Simulated** (wizard UI **Implemented**; styling & chat deterministic/local) |
| `/saved` | `StudioRouteGuard` -> `AppStudio` (`tab='saved'`) | Saved Looks & Favorites grid | `authenticated` or `guest` | Guest sees 3 `DEFAULT_SAVED_LOOKS` (can view `curated-default` look in `/stylist`); favorite toggle & delete prompt registration | Card grid with image fallback, toggle `isFavorite`, delete look (fires guarded `DELETE /api/outfits/:id` if 24-hex ObjectId), `"Wear / View Look"` restores slots into `/stylist` | `savedLooksStorage.ts` (`otd_saved_looks` / `otd_liked_looks` or `otd_private:<userId>:*`) | **Partially Implemented** (missing `/api/outfits` sync & detail/filter features) |
| `/shopping` | `StudioRouteGuard` -> `ShoppingListView` | Wardrobe-Aware Wishlist & Gap Budget planner | `authenticated` or `guest` | Guest can browse & filter (empty by default unless legacy); Add, Edit Budget, Mark Acquired (`addClosetItem`), Clear all prompt registration | Status/category filters, search, live closet ownership check, `findOwnedAlternatives`, inline INR budget editor, `"Move to Closet"` quick intake | `ClosetContext.shoppingList` | **Implemented** (client-side only; **Backend-Dependent** for `/api/shopping`) |
| `/destinations` | `StudioRouteGuard` -> `AppStudio` (`tab='destinations'`) | Destination Mode venue intelligence catalog | `authenticated` or `guest` | Full browse & category modal access; jumping to personalized styling uses `/stylist` | Browse `CURATED_VENUES` & `VenueCategoryModal`, select venue into stylist | Static `CURATED_VENUES` array in `AppStudio.tsx` | **Simulated** (**Backend-Dependent** for `/api/venues`) |
| `/calendar` | `StudioRouteGuard` -> `AppStudio` (`tab='calendar'`) | 7-day rolling schedule + monthly calendar preview | `authenticated` or `guest` | Full browse of sample schedule & day inspection modal; `"Style This Occasion"` opens `/stylist` | Dynamic 7-day dates (`computeWeekScheduleDays`), planned outfit slot inspection modal (`selectedCalendarDay`), monthly grid preview | `weekScheduleDays` base array + `savedLooksList` fallback matching | **Simulated** (**Backend-Dependent** for `/api/events`) |
| `/ideas` | `StudioRouteGuard` -> `AppStudio` (`tab='ideas'`) | Curated look ideas feed | `authenticated` or `guest` | Guests can browse cards; `"Recreate with My Closet"` prompts registration | Grid of editorial ideas; recreates title only (no real piece/slot loading) | Static array inside `AppStudio.tsx` | **Simulated** / **Partially Implemented** |
| `/tryon` | `StudioRouteGuard` -> `AppStudio` (`tab='tryon'`) | Virtual Try-On Studio Beta preview | `authenticated` or `guest` | Full read preview + `"Calibrate Style Avatar Biometrics"` button | Displays static model stock photo overlaid with profile name/height/bodyShape & active outfit title `(Size M)` | Hardcoded Unsplash image + `ClosetContext.profile` | **Simulated** (**Backend-Dependent**; no `tryon.dto.ts` or service exists yet) |
| `*` | `NotFoundView` | 404 fallback | Public | Same for all | Buttons to `/home`, `/closet`, or back/`/` | Static | **Implemented** |

---

## 3. Frontend Architecture

- **Framework & Build Stack (Exact `package.json` -> Resolved `package-lock.json` Versions):**
  - `react`: `^19.2.8` (`19.3.1`), `react-dom`: `^19.2.8` (`19.3.1`)
  - `react-router-dom`: `^7.18.5` (`7.18.5`)
  - `tailwindcss`: `^4.3.3` (`4.3.3`), `@tailwindcss/vite`: `^4.3.3` (`4.3.3`)
  - `lucide-react`: `^1.58.0` (`1.58.0`)
  - `vite`: `^8.3.0` (`8.3.4`), `@vitejs/plugin-react`: `^6.1.1` (`6.1.2`), `typescript`: `~6.0.2` (`6.0.3`), `oxlint`: `^1.81.0` (`1.88.0`)
- **Routing Strategy:** Declarative `BrowserRouter` (`main.tsx`) -> `Routes` (`App.tsx`) with layout route (`StudioRouteGuard` -> `StudioLayout`) and React Router `backgroundLocation` modal routing for `/login`, `/register`, `/onboarding`, `/profile`, with open-redirect sanitization (`safeRedirectTo`).
- **Styling & Theme Architecture:**
  - Tailwind CSS v4 (`@import "tailwindcss";` in `web/src/index.css`) paired with CSS Custom Properties under `:root` (Light: *Ivory Couture*) and `.dark` (Dark: *Obsidian Noir*), toggled by `ThemeContext.tsx` (`otd_theme` in `localStorage` defaulting `'light'`, toggles `.dark` / `.light` class on `<html>`).
  - Editorial utility classes defined in `index.css`: `.font-serif-luxury`, `.font-playfair`, `.font-cinzel`, `.font-script`, `.gold-gradient-text`, `.editorial-rule`, `.editorial-rule-gold`, `.editorial-card`, `.editorial-btn-primary`, `.editorial-btn-secondary`, `.editorial-btn-gold`, `.editorial-badge`, `.skip-to-content:focus`.
  - **Styling Defect Observed:** `web/src/App.css` is an empty comment stub (`1` line). Multiple components (`Hero`, `WardrobeStudio`, `InteractiveStylist`, `Pillars`, `GapIntelligence`, `Lookbook`, `AppDownload`, `ApkModal`, `Navbar`, `NotFoundView`, `UserProfileModal`, `EditPieceModal`, `EditPieceModal`/`ClosetUploadView`/`AppStudio` modals) reference **undefined** classes `.glass-card`, `.gold-btn`, `.gold-btn-outline`, `.animate-fadeIn` and **uninstalled `tailwindcss-animate` plugin utilities** (`animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-*`), causing silent visual/animation no-ops.
- **State Management:**
  - `ThemeContext` — Theme mode (`light` / `dark`).
  - `AuthContext` — Session lifecycle (`initializing | unauthenticated | authenticated | guest`), memory token helpers, `login`, `register`, `logout`, `refreshSession`, `enterGuestMode`, `exitGuestMode`.
  - `ClosetContext` — Scope-synchronized workspace (`profile`, `closet`, `shoppingList`, `currentOutfit`, `isGenerating`, `history`), using synchronous render-time + `useLayoutEffect` workspace switching so stale user state is never exposed across account switches.
  - Component-local React state (`AppStudio` manages `savedLooksList`, wizard steps `1..3`, chat history, venue/weather/mood/constraints, drawer/modal states, timers).
- **Client Storage Mechanisms (`localStorage`, `sessionStorage`, `IndexedDB`, Memory):**
  - **Memory-only (`authSession.ts`):** `accessTokenMemory`, `sessionEpoch`, `inFlightRefreshPromise`, `bootstrapPromise`. Never persisted to Web Storage.
  - **`sessionStorage` (`authStorage.ts`):** `otd_guest_demo_active` (`'1'` marks active Guest Demo session per tab).
  - **`localStorage` Preferences (Preserved on Logout):** `otd_theme`, `otd_user_settings`.
  - **`localStorage` Guest Workspace Keys:** `otd_closet_items`, `otd_user_profile`, `otd_shopping_list`, `otd_saved_looks`, `otd_liked_looks`, `otd_intake_draft_fallback`.
  - **`localStorage` Authenticated User-Scoped Keys:** `otd_private:<userId>:closet_items`, `otd_private:<userId>:user_profile`, `otd_private:<userId>:shopping_list`, `otd_private:<userId>:saved_looks`, `otd_private:<userId>:liked_looks`, `otd_private:<userId>:intake_draft_fallback`.
  - **`IndexedDB` (`otd_intake_db` v1, store `garment_drafts`):** Guest key `active_intake_session`; Authenticated key `auth_intake_session:<userId>`. Unwritable scopes (`initializing`, `unauthenticated`, `missing-user-id`) map to `{ kind: 'none' }` and perform zero Web Storage / IndexedDB I/O.
- **Reusable UI Components & Accessibility:**
  - `useFocusTrap` (`src/utils/focusTrap.ts`) provides focus trapping, Escape dismissal, body scroll lock, focus restoration, and `isPaused` support for nested modals (`UserProfileModal` / `OnboardingModal` -> `GuestRegistrationPromptModal`).
  - Dedicated subcomponents under `src/components/ui/`: `AvatarOutfitCanvas`, `OutfitActionToolbar`, `OutfitSlotsList`, `OutfitResultHeader`, `OutfitRationaleCard`, `OutfitGenerationLoader`, `GarmentConstraintsSection`, `GarmentSwapModal`, `StylistReviewSummary`, `MobileBottomNav`, `NotificationPopover`, `SettingsModal`, `LegalModal`, `OccasionModal`, `VenueCategoryModal`.
  - **Orphaned Component:** `web/src/components/AddPieceModal.tsx` (`649` lines) has **zero imports anywhere in `web/src/`** (superseded by `/closet/add` -> `ClosetUploadView.tsx`).
- **Error, Loading & Validation Handling:**
  - Global `ErrorBoundary` with diagnostic trace accordion and `"Reset Cache & Recover"` action.
  - `apiErrors.ts` (`ApiError` class) categorizes `NETWORK_ERROR`, `TIMEOUT`, `ABORTED`, `MALFORMED_RESPONSE`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`, etc., including Vite 500/502/504 non-JSON proxy failures.
  - Garment validation centralized in `garmentValidation.ts` (`5MB` max, `image/jpeg|png|webp`, field length caps matching backend Mongoose/Zod limits); duplicate detection in `duplicateDetector.ts`; browser-side Canvas compression (`imageCompressor.ts`); `ClosetContext` listens/dispatches `otd:storage-quota-exceeded` when `localStorage` quota overflows.
- **Animations:** Native CSS transitions/transforms, Tailwind `animate-pulse` / `animate-spin`, plus unimplemented `animate-in` / `fade-in` / `animate-fadeIn` utility classes noted above, with `prefers-reduced-motion: reduce` support in `index.css`.

---

## 4. API Integration Readiness (Vasant = Backend & API Wiring)

> **Ownership Boundary:** **Vasant** owns backend development and all API service wiring. **Piyush** owns frontend UI, components, client validation, and frontend readiness only.

### 4.1 Infrastructure Layers Ready in `web/src/`
- **`services/api/`:** Reusable `createApiClient()` + `apiClient` singleton (`apiClient.ts`, `api.types.ts`, `apiErrors.ts`, `index.ts`).
- **DTOs (`src/types/api/` — 10 files):** Exact wire contracts mirroring Express controllers/validators/models (`common.dto`, `auth.dto`, `wardrobe.dto`, `outfit.dto`, `ai.dto`, `profile.dto`, `preferences.dto`, `shopping.dto`, `events.dto`).
- **Domain Models (`src/types/domain/` — 10 files):** Normalized UI/domain entities (`common`, `auth`, `savedLook`, `profile`, `wardrobe`, `outfit`, `preferences`, `shopping`, `calendar`).
- **Adapters (`src/adapters/` — 11 files):** Pure stateless mappers (`shared`, `auth`, `savedLook`, `profile`, `wardrobe`, `outfit`, `preferences`, `shopping`, `calendar`, `ai`) handling `_id` vs `id`, `total` vs `totalItems`, `.strict()` Zod payload stripping, `shoes` <-> `footwear` category translation, `weight`/avatar stripping for `/api/profile`, and 24-hex Mongo ObjectId verification (`isMongoObjectId`, `partitionMongoItemIds`).
- **Services (`src/services/`):** `auth.service.ts` (actively wired), `authSession.ts` (actively wired), `outfits.service.ts` (`fetchOutfitsAsSavedLooks`, `fetchBackendOutfitByIdAsSavedLook`, `deleteBackendOutfitForLook`, `prepareCreateOutfitPayload` — only `deleteBackendOutfitForLook` imported in `AppStudio.tsx:78`).

### 4.2 Transport, Security, Timeouts & Retry Behavior (`apiClient.ts` & `auth.service.ts`)
- **Base URL:** `VITE_API_BASE_URL` normalized (default `/api`).
- **Auth Injection & Cookies:** Attaches `Authorization: Bearer <accessTokenMemory>` only on same-API-origin requests when `!skipAuthHeader`; defaults `credentials: 'include'` on all requests so `HttpOnly` refresh cookies are transmitted cleanly.
- **Serialization:** Auto-serializes JSON objects; deletes `Content-Type` header for `FormData` so browsers generate multipart boundary headers; safely handles `204/205` and empty bodies; flags JSON `{ success: false }` on `2xx` as `ApiError`.
- **Timeouts & Cancellation:** Default request timeout `15_000 ms`; refresh & auth endpoints `10_000 ms`; supports external `AbortSignal` merged with internal timeout `AbortController`.
- **Retry / 401 Recovery:** Retries **at most once** exclusively on `401` after single-flight `POST /api/auth/refresh` (with epoch guard so logout/user-switch aborts stale replay). **Does not** retry `403`, network errors, or timeouts, and **does not** recurse on `/auth/refresh`.

### 4.3 Complete Backend Endpoint Inventory Found in Codebase

#### A. Actively Called Endpoints
| Endpoint | Caller | Status & Notes |
| :--- | :--- | :--- |
| `POST /api/auth/login` | `auth.service.ts:117` <- `AuthContext.tsx` <- `AuthModal.tsx` | **Wired & Active.** Expects `{ email, password }`; sets in-memory `accessToken` + `HttpOnly` cookie. |
| `POST /api/auth/register` | `auth.service.ts:134` <- `AuthContext.tsx` <- `AuthModal.tsx` | **Wired & Active.** Expects `{ name, email, password }`. |
| `POST /api/auth/refresh` | `auth.service.ts:147,156` & `apiClient.ts:353` | **Wired & Active.** Called once on initial StrictMode mount (`bootstrapRefresh`) and automatically on `401` recovery. |
| `POST /api/auth/logout` | `auth.service.ts:166` <- `AuthContext.tsx` | **Wired & Active.** Clears server cookie & always clears memory + private local caches in `finally`. |
| `DELETE /api/outfits/:id` | `outfits.service.ts:87` <- `AppStudio.tsx:978` | **Conditionally Wired (Currently Inert).** Fire-and-forget call runs *only* if `resolveSavedLookIdentifier(look).isPersistedOnBackend` (`24-hex` Mongo ObjectId); all current local looks use non-Mongo IDs (`local-look-*`, `smart-casual-1`), so zero HTTP calls trigger today. |

#### B. Defined in Services, DTOs, or Adapters ONLY (Not Called from UI)
| Domain | Endpoints Referenced in `services/` / `types/api/` / `adapters/` | Current UI Gap / Blocker |
| :--- | :--- | :--- |
| **Outfits** | `GET /api/outfits`, `GET /api/outfits/:id` (`outfits.service.ts`); `POST /api/outfits`, `PATCH /api/outfits/:id`, `POST /api/outfits/generate`, `POST /api/outfits/history`, `GET /api/outfits/history`, `DELETE /api/outfits/history/:id` (`outfit.dto.ts`, `outfit.adapter.ts`) | Write sync intentionally disabled in `outfits.service.ts:11-13` until backend reconciles `outfits.validator.ts` (`clothingItemIds`) with `models/Outfit.ts` (`wardrobeItemIds` / `isFavorite`) and Wardrobe persists Mongo ObjectIds. |
| **Wardrobe** | `GET /api/wardrobe`, `POST /api/wardrobe`, `GET /api/wardrobe/:id`, `PATCH /api/wardrobe/:id`, `DELETE /api/wardrobe/:id`, `POST /api/wardrobe/:id/image` (multipart field `"image"`), `DELETE /api/wardrobe/:id/image` (`wardrobe.dto.ts`, `wardrobe.adapter.ts`) | No `wardrobe.service.ts` exists yet; `ClosetContext` & `ClosetUploadView` persist locally only. |
| **AI & Recognition** | `POST /api/ai/chat`, `POST /api/ai/pipeline`, `GET /api/ai/conversations`, `POST /api/ai/conversations`, `GET /api/ai/conversations/:id`, `DELETE /api/ai/conversations/:id`; internal service ref `POST ${AI_SERVICE_URL}/recognize-clothing` (`ai.dto.ts`, `wardrobe.dto.ts`, `ai.adapter.ts`) | No `ai.service.ts` exists. `AppStudio` runs deterministic `outfitSynthesizer.ts` and hardcoded keyword replies. |
| **Profile & Avatar** | `GET /api/profile`, `POST /api/profile`, `PUT /api/profile`, `PATCH /api/profile`, `GET /api/avatar`, `POST /api/avatar`, `PUT /api/avatar`, `POST /api/avatar/upload` (`profile.dto.ts`, `profile.adapter.ts`) | No `profile.service.ts` exists. `OnboardingModal` / `UserProfileModal` mutate `ClosetContext` locally. |
| **Preferences & Vibes** | `GET /api/preferences`, `PUT /api/preferences`, `PATCH /api/preferences`, `POST /api/preferences/reset`, `GET /api/vibes`, `GET /api/vibes/active`, `POST /api/vibes`, `GET /api/vibes/presets`, `PUT /api/vibes/:id`, `PATCH /api/vibes/:id`, `DELETE /api/vibes/:id` (`preferences.dto.ts`, `preferences.adapter.ts`) | No service exists; stylist moods/preferences/settings are stored locally or component-local only. |
| **Shopping & Intelligence** | `GET /api/shopping`, `POST /api/shopping`, `PATCH /api/shopping/:id`, `DELETE /api/shopping/:id`, `POST /api/shopping/:id/purchased` (`shopping.dto.ts`, `shopping.adapter.ts`); plus Wardrobe Gaps/Analytics/Usage DTOs (`BackendWardrobeGapDto`, `BackendWardrobeAnalyticsDto`, `LogWardrobeUsageRequestDto` in `shopping.dto.ts`) | No service exists; `ShoppingListView` uses `ClosetContext.shoppingList` (`localStorage`). |
| **Events, Venues & Weather** | `GET /api/events`, `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`, `POST /api/events/:id/recommend`, `GET /api/venues`, `GET /api/venues/:id/intelligence`, `GET /api/weather` (`?lat=&lon=` or `?city=`) (`events.dto.ts`, `calendar.adapter.ts`) | No service exists; calendar, venues, and weather use hardcoded arrays and strings (`Hyderabad 32°C`). |

#### C. Explicitly Missing / Unmounted Endpoints Documented in Contracts (`@pendingPublicRoute` / Docs)
- `GET /api/auth/me`, `POST /api/auth/forgot-password`, password change, account deletion, Google/Apple OAuth, phone auth (verified absent in `PHASE1_AUTH_INTEGRATION_NOTES.md`).
- **Wardrobe & Avatar Image Retrieval Stream (`GET /api/wardrobe/:id/image` or signed URL):** Upload exists in `wardrobe.dto.ts:85`, but no `GET` image stream route is documented/mounted to render uploaded GridFS photos back in React `<img>` tags.
- **Public Clothing Recognition HTTP Route** (e.g., `/api/wardrobe/recognize` or `/api/ai/recognize`, marked `@pendingPublicRoute` in `wardrobe.dto.ts:141`).
- **Public `stylistAdviceSchema` / Outfit Refinement Endpoint** (marked `@pendingPublicRoute` in `ai.dto.ts:88`).
- **Outfit Rating Route** (`BackendOutfitRatingDto` marked `@pendingPublicRoute` in `outfit.dto.ts:181`).
- **Virtual Try-On HTTP Service & DTO Routes:** `BackendVirtualTryOnDto` exists in `ai.dto.ts`, but **no endpoints, request DTOs, or frontend `tryon.service.ts`** exist.

---

## 5. Authentication & Session Handling

### 5.1 Lifecycle Flows (`AuthContext.tsx`, `auth.service.ts`, `authSession.ts`)
- **Bootstrap (`status = 'initializing'`):** On mount, if `sessionStorage.otd_guest_demo_active === '1'`, enters `status = 'guest'` immediately with zero `/api/auth/refresh` call. Otherwise calls `authService.bootstrapRefresh()` (deduplicated via `bootstrapPromise` so React 19 `StrictMode` double-invocation sends only **one** rotating refresh request). Success transitions to `'authenticated'` + sets memory `accessToken`; failure transitions to `'unauthenticated'`.
- **Login & Register:** Sends email/password via `POST /api/auth/login` or `POST /api/auth/register` (`credentials: 'include'`, `skipAuthHeader: true`, `skipAuthRefresh: true`). On success, advances `sessionEpoch`, writes `accessToken` to module memory, clears guest flag (`otd_guest_demo_active`), and switches `AuthContext` to `'authenticated'`.
- **Silent 401 Recovery (`apiClient.ts`):** When any protected request returns `401`, `executeWithAuthRecovery` invokes `runSingleFlightRefresh` (`POST /api/auth/refresh`), updates `accessTokenMemory`, and retries **once** with the new token if `sessionEpoch` has not changed. If refresh returns terminal `400`/`401`/`403`, fires `notifySessionInvalidated()` -> `AuthContext` logs user out cleanly.
- **Logout:** Calls `POST /api/auth/logout`, and inside `finally` always runs `clearMemoryAuthSession()`, `clearPrivateUserCaches()`, `setGuestDemoSessionActive(false)`, and sets `status = 'unauthenticated'`.

### 5.2 Account-Scoped Storage & Cross-Account Isolation (`authStorage.ts`, `ClosetContext.tsx`, `AppStudio.tsx`, `ClosetUploadView.tsx`)
Implemented in commit `4ae9f4e` to eliminate cross-account data leaks:
1. **Strict Scope Resolution (`resolveWorkspaceScope`):**
   - `authenticated` + valid `user.id` -> `{ kind: 'authenticated', userId }` -> keys `otd_private:<userId>:*` + IndexedDB `auth_intake_session:<userId>`. New authenticated accounts initialize with neutral empty `profile`, `closet: []`, `shoppingList: []`, `savedLooks: []` (zero demo seed contamination).
   - `guest` -> `{ kind: 'guest' }` -> keys `otd_closet_items`, `otd_user_profile`, etc. + IndexedDB `active_intake_session` (seeded with curated `INITIAL_CLOSET`, `DEFAULT_PROFILE`, `DEFAULT_SAVED_LOOKS`).
   - `initializing` | `unauthenticated` | `missing-user-id` -> `{ kind: 'none' }` (**zero reads/writes** to persistent storage; `unauthenticated` renders landing-page preview in memory only).
2. **Synchronous Scope Transitions:** `ClosetContext`, `AppStudio`, and `ClosetUploadView` perform synchronous render-time + `useLayoutEffect` workspace resets keyed by `workspaceScopeId`, increment `scopeGenerationRef` / `activeScopeIdRef`, clear in-flight `setTimeout` refs, ignore stale async callbacks (image compression, `FileReader`, camera `getUserMedia`, geolocation, outfit generation/modification, chat timers), and prevent React key reuse via `key={workspaceScopeId}` on modals (`App.tsx:329,340`).
3. **Race-Safe Cache Teardown (`clearPrivateUserCaches`):**
   - Same-tab logout scrubs only `activePrivateCacheOwnerId`'s `otd_private:<userId>:*` keys and IndexedDB `auth_intake_session:<userId>` via serialized `privateIndexedDbPurgeQueue` (`privateCachePurgeGeneration` aborts any in-flight `draftStorage.ts` write/load).
   - Preserves `otd_theme`, `otd_user_settings`, and Guest Demo keys.
   - **Documented Multi-Tab Limitation (`authStorage.ts:87-96`):** Cross-tab shared-origin session cookies cannot arbitrate sibling-tab React memory states without a future `BroadcastChannel`/auth-layer coordinator.
4. **Remaining Backend-Dependent Runtime Tests:** Live cookie rotation (`HttpOnly` / `SameSite`), `401` retry against live Express backend, and cross-account HTTP cache rehydration could not be runtime-tested because Express/MongoDB backend is offline/external to `web/`.

---

## 6. Saved Looks & Wishlist Deep Dive

### 6.1 Saved Looks Architecture (`AppStudio.tsx`, `savedLooksStorage.ts`, `savedLook.adapter.ts`, `types/domain/savedLook.ts`)
- **Domain Model (`SavedLook`):** Contains `id`, `backendOutfitId?: string` (only set for validated 24-hex Mongo ObjectIds), `sourceTemplateId?: string`, `origin: 'local' | 'api'`, `sourceKind: 'curated-default' | 'stylist-generated' | 'api-outfit'`, `title`, `subtitle`, `occasion`, `venue?`, `vibe`, `style`, `season`, `isFavorite`, `weatherTag`, `imageUrl`, `tags[]`, `garments[]`, `garmentIds[]`, `slotAssignments`, `slots[]` (`OutfitSlotPiece[]`), `variationIndex?`, `colorPalette[]`, `reason`, `savedAt`.
- **Storage & Migration:** Persisted via `loadStoredSavedLooks(scope)` / `persistSavedLooks(looks, scope)` into `saved_looks` and synced `liked_looks` (`deriveSyncedLikedLookIds()`). `mergeAndMigrateSavedLooks()` upgrades legacy objects (`otd_liked_looks` + `DEFAULT_SAVED_LOOKS`), seeds `DEFAULT_SAVED_LOOKS` (`Smart Casual`, `Date Night`, `Office Ready` from `HOME_SUGGESTION_TEMPLATES`) **only** in Guest Demo (`allowDemoSeed`), never for authenticated users.
- **Duplicate Detection (`findDuplicateSavedLook`):** Computes canonical `(occasion, slot composition | garmentIds | garments)` signature (`buildSavedLookSignature`) so saving the same ensemble twice in Stylist toggles favorite or notifies duplicate instead of creating duplicate entries.
- **Slot Restoration (`restoreSavedLookSlots`):** Clicking `"Wear / View Look"` restores a look into `/stylist` Step 3 using 3 fallback tiers: (1) `look.slots`, (2) `look.slotAssignments` + `look.garmentIds`, (3) case-insensitive garment name fallback. Cross-references live `ClosetContext.closet` and cleanly degrades deleted/archived pieces to `status: 'missing'` instead of faking ownership.
- **Guest Restrictions:** Guests can view `curated-default` saved looks and preview `HOME_SUGGESTION_TEMPLATES`, but clicking save/heart on Home/Stylist/Saved or delete on Saved triggers `GuestRegistrationPromptModal`.
- **Current Gaps & Product Ambiguity:**
  1. **Favorited vs Bookmarked UI Discrepancy (`AppStudio.tsx:956-961, 1387, 3979, 4209`):** Tapping the heart button on `/saved` toggles `isFavorite` to `false` without removing the card, while the Sidebar `"Favorites"` badge (`likedLooks.length`) and Mobile bottom nav count **only `isFavorite === true`** looks (`favoriteLooksCount`), causing `/saved` subtitle (`"3 curated ensembles bookmarked • 1 favorited"`) and badge count to diverge unless a product rule separates Saved vs Favorites or unfavoriting removes the card.
  2. **Missing Backend Sync:** `fetchOutfitsAsSavedLooks`, `POST /api/outfits`, and `PATCH /api/outfits/:id` are **not called**; only a dormant `DELETE /api/outfits/:id` fires when `isPersistedOnBackend === true`. Blocked on backend reconciling `clothingItemIds` vs `wardrobeItemIds`.
  3. **Missing Saved Look Features:** No `/saved/:id` route, no look search/filter/sort (unlike Closet & Wishlist), no `OutfitRating` UI, and no `OutfitHistory` wear logging.

### 6.2 Wishlist Architecture (`ShoppingListView.tsx`, `ClosetContext.tsx`, `types/domain/shopping.ts`)
- **Domain Model (`ShoppingListItem`):** `id`, `name`, `category`, `subType?`, `brand?`, `color?`, `fit?`, `formality?`, `icon?`, `imageUrl?`, `stylingNote?`, `estimatedBudget?: number` (INR ₹), `outfitContext?: { occasion?, venue?, outfitTitle? }`, `addedAt`.
- **Capabilities Implemented Locally:**
  - Triggered directly from Stylist missing slots (`OutfitSlotsList.tsx`) or `"Add Wishlist Item"` modal in `/shopping`.
  - Guards against adding items already owned (`checkGarmentInCloset`) or already queued (`isItemInShoppingList`).
  - Live ownership status calculation (`Missing Staple` vs `Already in your closet`), Owned-Only Alternatives modal (`findOwnedAlternatives` compatibility scoring), inline INR estimated budget editing + summary totals, and 1-click `"Move to Closet"` (`addClosetItem` when authenticated).
- **Guest Restrictions:** Mutating actions (Add, Budget edit/clear, Intake to Closet, Clear Wishlist) invoke `GuestRegistrationPromptModal`.
- **Missing API Dependencies:** No `shopping.service.ts`; `/api/shopping` CRUD, `/api/shopping/:id/purchased`, and `WardrobeGap` server intelligence are not wired. Note also that current frontend `ShoppingListItem` is a budget-planned gap ledger without required external e-commerce `productUrl`, whereas backend `CreateShoppingRecommendationRequestDto` requires `productUrl`.

---

## 7. Complete Mock / Sample Data & Simulation Inventory

> **Instruction Compliance:** All mock data remains untouched. No mock files or arrays were removed or altered.

| File Path | Feature | What Is Simulated | Guest Demo Usage | Required Backend / AI Integration | Keep During Beta? |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `src/context/ClosetContext.tsx` (`INITIAL_CLOSET`, `DEFAULT_PROFILE`) | Digital Closet & Style Profile | 17 luxury menswear sample garments (`t1`–`a2`) + sample Curator profile (`5'11"`, `70 kg`, `Athletic / V-Taper`). | **Primary Guest Closet & Landing Demo** (`cloneInitialCloset`, `cloneDefaultProfile`). | `GET/POST/PATCH/DELETE /api/wardrobe`, `GET/PATCH /api/profile`, image streaming. | **Yes (Guest/Landing only)** |
| `src/utils/savedLooksStorage.ts` (`HOME_SUGGESTION_TEMPLATES`, `DEFAULT_SAVED_LOOKS`) | Home Suggestions & Default Saved Looks | 4 hardcoded editorial look templates (`sug-1`–`sug-4`, Unsplash photos) + 3 seeded saved looks (`smart-casual-1`, `date-night-1`, `office-ready-1`). | **Yes** — Home suggestions + `/saved` default gallery + guest look preview. | `GET/POST/PATCH/DELETE /api/outfits` (after schema fix). | **Yes (Guest Demo)** |
| `src/components/Hero.tsx` | Landing Hero & Context Studio | Hardcoded hero card (`"Tonight's Look"`, `21°C`), fake metrics (`10K+ Happy Users`, `4.8 ★`), static Unsplash destination tiles, local `generateOutfit` (`450ms`/`800ms` timeout). | **Yes** — Public landing hero experience. | Landing uses static/public showcase; authenticated Studio generation routes to `/api/ai/pipeline`. | **Yes (Landing showcase; remove fake metrics if unverified for Prod)** |
| `src/components/InteractiveStylist.tsx` (`PRESETS`) | Landing Live Atelier Simulator | 6 static preset outfits (`boardroom` / `soiree` / `weekend` x `old-money` / `minimalist`), fake `99.7%` confidence, local `savedCount = 142` (`350ms` delay). | **Yes** — Public `#atelier` simulator. | Optional public presets or keep static for zero-latency landing demo. | **Yes (Public Demo)** |
| `src/components/Pillars.tsx`, `Lookbook.tsx`, `GapIntelligence.tsx` | Landing Pillars, Lookbook, Gap Graph | Static 4 capability cards, static editorial lookbook carousel with Unsplash images, static wardrobe gap bar chart & upgrade suggestions. | **Yes** — Public landing marketing sections. | Gap Intelligence -> `/api/wardrobe-intelligence/*` & `/api/shopping` inside authenticated Studio. | **Yes (Landing Demo)** |
| `src/components/AppStudio.tsx` (`CURATED_VENUES`, `weekScheduleDays`, weather, ideas, tryon, chat, avatars) | Venues, Calendar, Weather, Ideas, Try-On, Chat | 4 hardcoded venues (`L'amore`, `Olive Bistro`, `Windmills Craftworks`, `Roastery Coffee House`); 7-day sample events (`weekScheduleDays`); static `"Hyderabad, India • 32°C Sunny"`; hardcoded header/Hero/Try-On Unsplash male photos; hardcoded profile hex dots; hardcoded `"Create Look"` `ideas` array; `setTimeout` (`1100ms`/`500ms`) loaders & keyword-matched fake chat replies. | **Partial** — Used in both Guest & Authenticated Studio today! | `GET /api/venues`, `GET /api/venues/:id/intelligence`, `GET/POST /api/events`, `GET /api/weather`, `POST /api/ai/pipeline`, `POST /api/ai/chat`, Virtual Try-On API, User Avatar GET URL. | **Guest only; Replace in Auth Studio** |
| `src/components/ui/NotificationPopover.tsx` (`INITIAL_NOTIFICATIONS`) | Notification Bell Popover | 3 hardcoded Hyderabad weather/dinner/blazer notifications (`notif-1..3`). | Displayed in both modes (component-local state, non-persistent). | Future `/api/notifications` or live `/api/events` + `/api/weather` feed. | **No for Auth; Ok for Guest** |
| `src/components/ui/OccasionModal.tsx`, `VenueCategoryModal.tsx` | Stylist Quick-Pick Modals | Hardcoded occasion chips/presets and venue category tags. | **Yes** — UI picker catalogs. | Optional `GET /api/venues` categories or keep as taxonomy catalog once Ali confirms taxonomy. | **Yes (UI Taxonomy)** |
| `src/components/ClosetUploadView.tsx` (`PRESET_EDITORIAL_PIECES` & dev QA panel) | Closet Upload Presets & Simulation Triggers | 4 hardcoded luxury piece presets (`Loro Piana`, `Fox Brothers`, `Gucci 1953`, `Brunello Cucinelli` with Unsplash URLs) + `import.meta.env.DEV` QA failure simulation buttons; fake local `"Preparing..."` progress (`stage` transitions). | Upload route blocked for guests (`isAuthenticated` required). | Replace fake auto-tag presets with AI recognition (`POST /api/wardrobe/recognize` -> user confirmation) + `POST /api/wardrobe` & `/image`. | **Replace presets with AI recognition for Auth** |
| `src/utils/outfitSynthesizer.ts` | Client Outfit Generator | Rule-based local matching over `ClosetContext.closet` returning `OutfitSlotItem[]`, generic compatibility scores (`94.2`–`98.8%`), and templated rationale copy. | Used when previewing curated defaults; currently also powers Auth `/stylist`. | Replace in Auth mode with `POST /api/ai/pipeline` (+ extended slot contract). | **Fallback only / Guest Preview** |
| `src/components/OnboardingModal.tsx` | Onboarding Mannequin Cards | 3 static mannequin options (`classic_tailored`, `modern_minimal`, `fluid_editorial`) + Unsplash gender imagery. | Shown in `/onboarding`. | Wire selected profile -> `PATCH /api/profile`; avatar -> `/api/avatar`. | **Yes (UI Options)** |

---

## 8. Build & Development Setup

### 8.1 Environment & Tooling
- **Observed Local Tooling:** Verified `node v26.3.0` and `npm 11.12.1` on Windows (`win32`). (`web/package.json` specifies **no** `"engines"` constraint.)
- **Environment Variables (`web/.env.example` ONLY — no `.env` exists in repo):**
  - `VITE_API_BASE_URL=/api` — Base URL used by `apiClient` (`src/services/api/apiClient.ts`). Defaults to `/api`.
  - `VITE_PROXY_TARGET=http://127.0.0.1:5000` — Target URL used by Vite's dev proxy (`vite.config.ts`) for `/api/*` requests.

### 8.2 Exact Commands (from `web/` or using `--prefix web`)
- **Install Dependencies:** `npm --prefix web install` (or `cd web && npm ci`)
- **Start Dev Server (with `/api` proxy -> `http://127.0.0.1:5000`):** `npm --prefix web run dev`
- **Lint (`oxlint`):** `npm --prefix web run lint`
- **Typecheck + Production Build:** `npm --prefix web run build` (runs `tsc -b && vite build` -> outputs `web/dist/`)
- **Preview Production Bundle Locally:** `npm --prefix web run preview`

### 8.3 Deployment & CORS / Cookie Notes
- **Hosting Config:** **None present** in repo (`vercel.json`, `netlify.toml`, `Dockerfile` absent).
- **Proxy vs Cross-Origin Production Rule (from `PHASE1_AUTH_INTEGRATION_NOTES.md`):**
  - **Recommended:** Serve SPA and `/api/*` behind same origin / reverse proxy so backend `sameSite: 'strict'` `HttpOnly` refresh cookies (`path: '/api/auth'`) work natively without cross-site cookie blocks.
  - **If Split Origins (e.g., `app.otd.com` + `api.otd.com`):** Backend requires `FRONTEND_URL` CORS allowlist with `credentials: true` AND `sameSite: 'none'; secure: true` on `refreshToken` cookies over HTTPS.

---

## 9. Pending Issues & Dependencies (By Owner)

> Updated against commit `4ae9f4e`: earlier issues resolved in `4ae9f4e` (auth race conditions, per-user workspace isolation `otd_private:<userId>:*`, IndexedDB cross-user draft cleanup, DEF-01..04 async guards, mobile drawer focus trap, 5MB/JPEG/PNG/WebP validation parity in `garmentValidation.ts`, dynamic 7-day calendar dates, `StudioRouteGuard` / `GuestRegistrationPromptModal`) are **excluded** from pending defects below.

### 9.1 Frontend Remaining Work — **Piyush** (UI, Local State, Validation & Styling Cleanup Only; No Backend/API Wiring)

#### High Priority (P1 — Functional / UX Bugs in Current Code)
1. **Custom Destination Ignored (`AppStudio.tsx:720,939,3042,3082,3110,3168`):** Expressions evaluate `selectedVenue.name || destinationSearch`, so typing a custom venue is silently ignored whenever default `"L'amore"` is populated.
2. **Venue Preview Card Tabs Are No-Op (`AppStudio.tsx:2647-2664`):** Clicking `about | ambience | dress_code | photos` changes underline styling only; card body always renders `selectedVenue.description` + same 4 badges.
3. **Weather Skip Desync (`AppStudio.tsx:2855-2861`):** Selecting a weather card on Step 2 does not reset `setIsWeatherSkipped(false)`, and Step 2 has no visible `"Skip Weather"` toggle.
4. **Step 2 Edit Scroll Anchors Broken (`AppStudio.tsx:2980-2988`):** `StylistReviewSummary` edit callbacks invoke `window.scrollTo(...)`, which has no effect because scrolling occurs inside `<main id="studio-main" className="... h-full overflow-y-auto">` (`AppStudio.tsx:1507`).
5. **Sidebar/Nav Reset & Home Omnibar Defaulting:**
   - Clicking `"AI Stylist"` (`AppStudio.tsx:1400`) or Mobile `"stylist"` (`AppStudio.tsx:4204`) calls `resetStylistSession(1)`, destroying any active generated/restored look.
   - Home Omnibar / Search / Chips (`AppStudio.tsx:1532,1672,1691,1724`) jump straight to Step 3 with default `'Date'` / `"L'amore"`, and `"Create Look"` (`ideas`) `"Recreate with My Closet"` (`AppStudio.tsx:3952-3954`) only sets `currentOutfitTitle` without loading garments.
6. **Onboarding / Profile Modal Parity & Stale Copy (`OnboardingModal.tsx`, `UserProfileModal.tsx`):**
   - `OnboardingModal` initializes `heightValue` & `weightValue` as `''` instead of prefilling existing `profile.height` / `profile.weight`.
   - `OnboardingModal` vs `UserProfileModal` still offer mismatched fit/bodyShape label sets (`'Regular Fit'` vs `'Regular Classic'`, `'Slim Fit'` vs `'Tailored / Slim'`).
   - `OnboardingModal.tsx:911,1039` privacy notice still claims measurements/photos are *"kept strictly local to your browser session"* / *"never transmitted"* — must be updated before cloud profile/avatar sync lands.
   - Header Avatar (`AppStudio.tsx:1594`) and Virtual Try-On (`AppStudio.tsx:4120,4128`) display hardcoded stock male portrait + `(Size M)`, ignoring `profile.referencePhotoUrl` / `profile.wardrobeFocus`; Home Style Profile (`AppStudio.tsx:1992`) hardcodes 5 color swatches instead of reading `profile.palettePreferences`.

#### Medium Priority (P2 — Styling, Cleanup & Technical Debt)
7. **Undefined CSS Classes & Missing Animation Plugin:** Define or replace `.glass-card`, `.gold-btn`, `.gold-btn-outline`, `.animate-fadeIn`, and either install `tailwindcss-animate` or replace `animate-in`/`fade-in`/`zoom-in-95`/`slide-in-from-*` across `Hero`, `WardrobeStudio`, `InteractiveStylist`, `Pillars`, `AppDownload`, `ApkModal`, `Navbar`, `UserProfileModal`, `EditPieceModal`, `ShoppingListView`, `AppStudio`, `GuestRegistrationPromptModal`, `NotFoundView`.
8. **Dead Synthesizer & Filter Branches:**
   - `outfitSynthesizer.ts:119` checks `selectedPreferences.includes('Ultra-Light')`, while `AppStudio.tsx:2885` offers `'Light & Breezy'` (never `'Ultra-Light'`). `selectedMoods` and `profile.palettePreferences` / `stylePersonas` are currently ignored in synthesis scoring.
   - `EditPieceModal.tsx` stores `selectedFile` (`File`) in local state, converts to compressed base64 `previewUrl`, and omits `rawFile` from `onSave(updatedItem)` (needed later for `POST /api/wardrobe/:id/image`).
   - `profile.adapter.ts` `formatCmToHeightDisplay()` defaults `'imperial'`, whereas `SettingsModal.tsx` defaults `measurementUnit: 'metric'`.
9. **Code Hygiene, Bundle Size & Strict TS:**
   - Remove orphaned `web/src/components/AddPieceModal.tsx` (`649` lines, zero imports).
   - Remove legacy `"Task 7"` UI badge (`ClosetUploadView.tsx:1323`) & align QA controls copy (`ClosetUploadView.tsx:2704`).
   - Fix 4 `oxlint` `react/only-export-components` warnings (`ThemeContext.tsx`, `ClosetContext.tsx`).
   - Add `React.lazy` route/tab code splitting (`AppStudio` `4,817` lines, `ClosetUploadView` `2,812` lines, `ShoppingListView` `1,503` lines currently produce a single `921.53 kB` JS bundle).
   - Consider enabling `"strict": true` in `tsconfig.app.json`.

---

### 9.2 Backend & API Wiring — **Vasant**
1. **Resolve Critical `Outfits` Validator vs Mongoose Schema Mismatch (Blocking Saved Looks & Outfit API Wiring):** Reconcile `outfits.validator.ts` (`clothingItemIds`, `.strict()`, `status`, `colorPalette`, `aiGenerated`, `rating`) with `models/Outfit.ts` (`wardrobeItemIds`, `isFavorite`).
2. **Mount Missing Public Backend Routes Identified in Contracts:**
   - Wardrobe / Avatar image **retrieval** endpoint (`GET /api/wardrobe/:id/image` or signed URL, paired with existing `POST /api/wardrobe/:id/image`).
   - Public Clothing Recognition endpoint (`POST /api/wardrobe/recognize` or `/api/ai/recognize`).
   - Public `stylistAdvice` / outfit refinement route & `OutfitRating` route.
   - `GET /api/auth/me` & password reset (`POST /api/auth/forgot-password`) + OAuth endpoints if in Beta scope.
3. **Standardize Wire Contracts & Multer Responses:** Clarify `_id` vs `id` and `total` vs `totalItems` inconsistencies; verify Multer `413` (`5MB`) and `415` (`JPEG/PNG/WebP`) JSON error envelopes; verify `HttpOnly` cookie `sameSite`/`FRONTEND_URL` CORS settings for staging/production.
4. **Build & Wire Missing Domain Services (`web/src/services/`):** Create and integrate `wardrobe.service.ts`, `profile.service.ts`, `preferences.service.ts`, `shopping.service.ts`, `calendar.service.ts` (events/venues/weather), `ai.service.ts`, `tryon.service.ts`, and complete `outfits.service.ts` wiring across `ClosetContext` and Studio views using existing `src/types/api/` + `src/adapters/`.
5. **Decide Wishlist Contract Fit:** Either allow `productUrl` to be optional on `/api/shopping` for manual gap items without retailer links, or clarify distinction between `WardrobeGap` and `ShoppingRecommendation`.

---

### 9.3 AI / ML Pipeline — **Vyshnavi**
1. **Garment Recognition HTTP Contract:** Finalize `POST /recognize-clothing` response schema (`material` vs `fabric`, `fit`, `formality`, optional cutout URL `cutoutImageUrl`, and multi-garment bounding boxes when a single photo shows multiple pieces), keeping `requiresUserConfirmation: true`.
2. **Stylist Pipeline Enrichment:** Support Studio Steps 1–3 inputs (`mustIncludeItemIds`, `mustIncludeKeywords`, `avoidKeywords`, `moods`, `venueName`, `venueCategory`, `scheduledDate`, `scheduledTime`, `weatherOverride`) and emit per-slot owned-vs-missing (`top`, `outerwear`, `bottom`, `footwear`, `accessory`) + structured rationale (`colorHarmony`, `styleAlignment`, `dressCodeNote`, `weatherNote`) as sketched in `@pendingExternalContract` inside `src/types/api/ai.dto.ts`.
3. **Conversational Outfit Refinement & Virtual Try-On Pipeline:** Define `/api/ai/chat` + outfit refinement contract (`AiOutfitRefinementRequestDto`) returning updated ensemble IDs/slots rather than plain text only; align `BackendVirtualTryOnDto` generation pipeline & polling/webhook contract.

---

### 9.4 Product Decisions — **Ali / Mustafa**
1. **Canonical Taxonomy Alignment:** Confirm final supported garment categories (`'footwear'` vs `'shoes'`, `'dresses'`, `'activewear'`, `'ethnic-wear'`, `'other'`), `WardrobeFocus` (`women/men/personalize` vs `womenswear/menswear/unisex`), and unified fit/body-shape labels across Onboarding & Profile.
2. **Saved vs Favorite Looks Semantics:** Decide whether hearting/unhearting in `/saved` should delete the look vs toggle `isFavorite` independently of bookmarking, so Sidebar badge (`likedLooks.length`), Mobile badge, and `/saved` grid match cleanly.
3. **Guest -> Authenticated Transition Policy:** Confirm whether Guest Demo exploration stays completely discarded upon login/registration (current strict isolation behavior) OR whether selected Guest items/looks should prompt `"Import my demo picks?"` on signup.
4. **Mobile APK Distribution & Store Links (`web/public/` & `ApkModal.tsx`):** Provide the actual `fashion_otd_companion.apk` binary (currently missing 404 link) or temporarily replace APK download cards/modals with a `"Coming Soon / Waitlist"` state; clarify landing marketing metrics (`"10K+ Happy Users"`, `"4.8 ★"`).
5. **Onboarding Privacy Copy Approval:** Approve updated privacy disclosure once `OnboardingModal` / `UserProfileModal` sync biometrics and photos to `/api/profile` & `/api/avatar`.
6. **Beta Launch Scope:** Confirm which Studio features are Beta-mandatory (Closet CRUD, AI Stylist, Saved Looks, Profile) vs deferred/preview-flagged (Virtual Try-On 3D mesh, Calendar AI auto-recommend, OAuth, Notifications feed).

---

### 9.5 QA Support — **Balaji**
1. **Browser E2E & Responsive Test Matrix (Post-API Wiring & On Live Backend):**
   - Execute full Auth + Session cookie rotation + `401` single-flight recovery tests against live Express/Mongo (`127.0.0.1:5000`).
   - Verify multi-account isolation (`User A` -> logout -> `User B` -> Guest Demo) across IndexedDB (`otd_intake_db`), `localStorage` (`otd_private:*`), and camera/compression interrupts.
   - Verify responsive layouts across mobile (`<640px`), tablet (`768px`), and desktop (`>=1024px`) for `AppStudio`, `ClosetUploadView`, `ShoppingListView`, `AvatarOutfitCanvas`, and landing sections.
   - Establish baseline smoke suite (e.g., Vitest + Playwright) targeting auth guards, guest registration prompts, and `savedLooksStorage` / `adapters/` unit tests.

---

## 10. Unverified Areas & Audit Boundaries

The following could **not** be verified from static workspace inspection and local lint/build checks alone:
1. **Live Express / MongoDB / GridFS Runtime:** No live backend server was started or probed; live `HttpOnly` cookie flags, rate limits (`authLimiter`), real HTTP `401` recovery, and actual `POST /api/wardrobe` / `DELETE /api/outfits/:id` responses remain unexecuted.
2. **External AI Service (`AI-FASHION-OTD` / `AI_SERVICE_URL`):** External repositories were not inspected or executed in this task; live AI recognition, pipeline latency, and try-on payloads remain unverified at runtime.
3. **Live Browser Rendering & Responsive QA:** No headless/interactive browser session was executed on `4ae9f4e` during this audit; visual consequences of the undefined CSS classes (`.glass-card`, `.gold-btn`, `animate-in`) and mobile viewport ergonomics are verified by code inspection only.
4. **Deployment Environment & Real Secrets:** `web/` has no `.env` file, hosting manifest (`vercel.json`, `netlify.toml`), or CI pipeline; deployed origin headers, TLS/cookie domains, and CDN CORS behavior are unverified.
5. **APK Binary & Automated Tests:** `web/public/fashion_otd_companion.apk` does not exist in the repository, and zero automated test suites exist to run.

---

## 11. Progress Addendum Since Baseline Commit `4ae9f4e` (Updated November 12, 2026)

> **Important:** Sections `1–10` above document the historical read-only baseline at commit `4ae9f4e`. Subsequent working-tree updates on `integrate/frontend-into-main` resolved all Piyush-owned items listed in Section `9.1` alongside the Hero & Four-Step editorial refinement summarized below. See [OTD_COMPLETE_WEB_AUDIT_REPORT.md](./OTD_COMPLETE_WEB_AUDIT_REPORT.md) for the full item-by-item breakdown.

### 11.1 Completed Work After `4ae9f4e`
1. **Phase 3–5 & Complete Audit P0–P3 Frontend Completion (`web/src/`):**
   - Enabled strict TypeScript (`"strict": true` in `tsconfig.app.json`), class-based `@custom-variant dark` (`src/index.css`), and route/modal code splitting (main bundle `471.53 kB` / `136.93 kB` gzip vs prior `921.53 kB`).
   - Resolved all Section `9.1` P1/P2 items: Hero & Studio omnibar/custom venue/weather-skip sync, Venue preview tabs, `StylistReviewSummary` container scroll anchors, Sidebar active-session preservation, Onboarding/Profile label & metric/imperial parity, `NotificationPopover` & `Lookbook` `useFocusTrap`, nested dialog focus-trap pausing, elimination of all nested interactive buttons, paired form labels & visible focus rings, broken Unsplash asset fixes, undefined utility CSS classes (`.glass-card`, `.gold-btn`, `.animate-in`, etc.), honest Android `"Early Beta · Coming Soon"` status, `MobileBottomNav` clearance (`pb-24`), and deletion of `7` unused legacy files (`AddPieceModal.tsx`, `App.css`, `auth.types.ts`, unused Vite/SVG/PNG assets — codebase now `89` TS/TSX files + `index.css` = `90` linted files).
2. **Hero Headline & Four-Step Experience Editorial Redesign (`Hero.tsx`, `index.css`):**
   - Moved `"Your style. Every place."` to lower-left negative space (`bottom-5 left-4 sm:bottom-8 sm:left-7 lg:bottom-9 lg:left-7`) with `.otd-hero-script` fluid `clamp()` sizing and gradient scrim so it never overlaps the model's upper face or the `"Tonight's Look"` preview card across `375px–1440px`.
   - Redesigned `HOW_IT_WORKS_STEPS` (`01`–`04`) into semantic `<article>` cards (`#how-otd-works`) with frosted step pills, progression rules/arrows, desktop pointer hover lift/image zoom (`.otd-step-card`, `.otd-step-image`), staggered `IntersectionObserver` scroll reveal (`.otd-step-reveal`) with scroll/RAF fallback, and explicit `@media (prefers-reduced-motion: reduce)` handling.

   - **Verified Post-Edit Matrix (Hero & 4-Step Pass):** `tsc --strict` (`0` errors), `oxlint` (`0` errors / `5` pre-existing fast-refresh export warnings), `vite build` (`PASS`, main chunk `471.53 kB` / `136.93 kB` gzip, CSS `121.88 kB`), and live headless Chromium CDP across all **5 viewports × Light & Dark themes** (`375×667` [1×4], `430×932` [1×4], `768×1024` [2×2], `1024×768` [4×1], `1440×900` [4×1]; `0px` horizontal overflow, zero headline/card collision, `4/4` revealed step cards, desktop `-5px` hover lift + `1.04` image zoom, `prefers-reduced-motion: reduce` verified, `0` broken images, `0` console/page/network errors).

### 11.2 Current Remaining Scope & External Dependencies
- **Pending Frontend Engineering (Piyush):** See **Section 12** below for the final November 12, 2026 read-only handover audit findings (specific newly uncovered P1/P2 edge cases in contrast, guest-switch purge, onboarding a11y, discard dialog backdrop, and `AppStudio.tsx:944` score floor). Working-tree edits remain uncommitted on `integrate/frontend-into-main`.
- **External Team Ownership Remaining Open:** Sections `9.2` (**Vasant** — Backend schema alignment & missing domain service wiring), `9.3` (**Vyshnavi** — AI recognition, stylist pipeline & try-on contracts), `9.4` (**Ali / Mustafa** — taxonomy, Saved vs Favorites policy, metrics/APK product decisions), and `9.5` (**Balaji** — live backend E2E & CI smoke suite).

---

## 12. Final Handover Readiness Verification (November 12, 2026)

### 12.1 Automated Static & Live Browser Results (Before Final Merge Review)
- **TypeScript (`tsc --strict --noEmit` on `tsconfig.app.json` + `tsconfig.node.json`):** **PASS** (`0` errors; `0` `as any`, `0` `@ts-ignore`, `0` `@ts-expect-error`).
- **Lint (`npm --prefix web run lint`, `90` files, `116` rules):** **PASS** (`0` errors; `5` pre-existing `react/only-export-components` warnings).
- **Production Build (`npm --prefix web run build`):** **PASS** (`1,995` modules; largest JS chunk `index-By_RAalk.js` `471.53 kB` / `136.92 kB` gzip; CSS `121.96 kB` / `18.69 kB` gzip).
- **Headless Chromium CDP over `vite preview` (`dist/`):**
  - **50 / 50 Responsive Matrix PASS:** All `10` routes (`/`, `/home`, `/closet`, `/stylist`, `/saved`, `/shopping`, `/destinations`, `/calendar`, `/ideas`, `/tryon`) across `375×667`, `430×932`, `768×1024`, `1024×768`, `1440×900` recorded `0px` horizontal overflow, `0` broken images, and `0` nested interactive controls.
  - **All 4 OS × App Theme Matrix PASS**, **16/16 direct route/guard/404 checks PASS**, **Hero & 4-Step overlap + `prefers-reduced-motion: reduce` PASS**, **stacked `UserProfileModal` -> `GuestRegistrationPromptModal` double-Escape PASS**, **`0` console errors / `0` page exceptions / `0` failed requests**.
- **Backend Probe (`127.0.0.1:5000/api/auth/refresh`):** **`connect ECONNREFUSED 127.0.0.1:5000`** — live backend auth, cookie rotation, `401` retry, and API wiring remain **BLOCKED / UNVERIFIED**.

### 12.2 Verified Remaining Frontend-Owned Items (`Piyush`) Flagged in Final Audit
1. **[P1] Incomplete `clearPrivateUserCaches()` on `enterGuestMode()` & Unmounted Provider (`AuthContext.tsx:56,145,154-159`, `authStorage.ts`):** `enterGuestMode()` clears memory session without purging prior authenticated `otd_private:<userId>:*` and `auth_intake_session:<userId>`; `logout`/401/account-switch rely on `activePrivateCacheOwnerId` rather than passing `userId` directly.
2. **[P1] Dark/Light Contrast Failures on Selected Pills & Badges (`OccasionModal.tsx:160,186,192`, `VenueCategoryModal.tsx:244,269`, `UserProfileModal.tsx:320,369`):** `dark:bg-white` + `text-emerald-400`/`text-[var(--gold-primary)]` (~`1.88:1`–`2.08:1`), light mode `bg-[var(--gold-primary)] text-white` (~`3.95:1`), and dark `.gold-btn` `text-emerald-400`.
3. **[P1] Studio Harmony Floor & Custom-Closet Fallbacks (`AppStudio.tsx:944`, `OutfitSlotsList.tsx:256,344`, `ClosetContext.tsx:897,907,909`):** `AppStudio.tsx:944` retains `Math.max(70, ...)` even with `0/5` owned items; `OutfitSlotsList.tsx:256` exposes raw `slot.closetItemId` strings and labels `'Unverified'` slots `'Wardrobe Gap'`; `ClosetContext.modifyOutfit` (`'no jeans'` / `'attractive'`) references hardcoded demo IDs.
4. **[P1] Modal A11y & Nested Dialog Edge Cases (`OnboardingModal.tsx:418,585,664-706`, `EditPieceModal.tsx:49-54,729-738`, `AvatarOutfitCanvas.tsx:225`, `VenueCategoryModal.tsx:211-217`):** `id="onboarding-modal-title"` missing on Steps 2–3 and `<div role="button">` lacks Space `preventDefault()`/`aria-pressed`; `EditDiscardConfirmDialog` backdrop click re-triggers parent close prompt; `<svg role="img">` wraps interactive `<g role="button">` hotspots in `AvatarOutfitCanvas`; minor missing `aria-label` (`VenueCategoryModal` clear button) and `type="button"` attrs.
5. **[P2] Technical Debt & Polish:** Metric/imperial & weight parity between `OnboardingModal` and `UserProfileModal`, `imageCompressor.ts` raw-DataURL fallback & `ClosetUploadView.tsx:2712` unawaited draft catch, `profile.adapter.ts:234` `preferredCategories` mapping, unref-counted `focusTrap.ts` body overflow lock, `GarmentConstraintsSection` quick-avoid copy mismatch, `GarmentSwapModal:150` `"4 ensemble pieces"` text, `<380px` narrow container tightening & `StudioRouteGuard:148` tap target height. See [OTD_COMPLETE_WEB_AUDIT_REPORT.md](./OTD_COMPLETE_WEB_AUDIT_REPORT.md) Section 6 for full details.

---

## 13. Final P1 Remediation & Handover Status (November 12, 2026)

> **Status Update:** After Section `12`'s read-only audit, all **4 verified P1 frontend-owned items** (`12.2 #1–#4`) were implemented on `integrate/frontend-into-main` (uncommitted working tree atop `4ae9f4e`) and re-verified before handover to **Vasant** (Backend/API) and **Vyshnavi** (AI/ML). Historical baseline Sections `1–12` remain intact.

### 13.1 P1 Remediation Summary
1. **Guest Mode & Account Cache Isolation (`web/src/utils/authStorage.ts`, `web/src/context/AuthContext.tsx`, `web/src/context/ClosetContext.tsx`):**
   - `enterGuestMode()`, `logout()`, `onSessionInvalidated`, `refreshSession()` failure, and `User A -> User B` identity switches now scrub outgoing `otd_private:<userId>:*` keys, legacy keys, and `auth_intake_session:<userId>` IndexedDB drafts via explicit `userId` (`preserveGuestSession: true` on Guest transitions), with `scopeGenerationRef` cancellation on async timeouts.
2. **Selected-State Contrast (`OccasionModal.tsx`, `VenueCategoryModal.tsx`, `UserProfileModal.tsx`):**
   - Fixed dark/light WCAG AA contrast on selected cards, pills (`Style DNA`), badges (`Selected`, `Active`), and `.gold-btn` saved indicator; added `<Check>` icons, `aria-pressed`, `type="button"`, and `aria-label="Clear venue category filter"`.
3. **Honest Harmony Score & Custom-Closet Matching (`outfitSynthesizer.ts`, `AppStudio.tsx`, `OutfitResultHeader.tsx`, `OutfitSlotsList.tsx`, `ClosetContext.tsx`):**
   - Removed `Math.max(70, ...)` floor in `AppStudio.tsx`; `0`-owned outfits render `"Unavailable — Insufficient Data"` / `"(0 Owned Pieces)"` and empty-closet `"Add Garments"` guidance; `OutfitSlotsList` hides internal `closetItemId` strings and keeps `'Unverified'` distinct from `'Missing Piece'`; `ClosetContext.generateOutfit` / `modifyOutfit` query `activeCloset` attributes dynamically with zero hardcoded demo IDs.
4. **Modal & Canvas Accessibility (`OnboardingModal.tsx`, `EditPieceModal.tsx`, `AppStudio.tsx`, `AvatarOutfitCanvas.tsx`, `LegalModal.tsx`, `InteractiveStylist.tsx`, `WardrobeStudio.tsx`):**
   - Added `id="onboarding-modal-title"` on `OnboardingModal` Steps 2–3 and native `<button type="button" aria-pressed>` Wardrobe Focus cards; rendered `EditDiscardConfirmDialog` outside parent backdrop click listener (`aria-hidden` on stacked `EditPieceModal` & `AppStudio` inspection modal + focus restore guard); updated `AvatarOutfitCanvas` to `<svg role="group">` with `aria-hidden="true"` pins (`1` tab stop per garment slot); added missing `type="button"` attributes.

### 13.2 Post-P1 Verification Summary
- **`tsc --strict --noEmit` (app + node):** **PASS (`0` errors)**.
- **`npm --prefix web run lint` (`90` files):** **PASS (`0` errors, `5` pre-existing warnings)**.
- **`npm --prefix web run build`:** **PASS (`1,995` modules, `3.40s`, main chunk `474.85 kB` / `137.58 kB` gzip)**.
- **Unit + Chromium CDP Checks:** `5/5` `authStorage` / `outfitSynthesizer` unit assertions **PASS**; Light/Dark selected-card contrast `6.70:1`–`21.00:1` **PASS**; `OnboardingModal` Steps 1–3 + Space key **PASS**; `AvatarOutfitCanvas` `role="group"` & `0` duplicate pin stops **PASS**; `25/25` responsive matrix (`0px` overflow, `0` broken images) + `prefers-reduced-motion: reduce` **PASS**; simulated-auth harness (`EditPieceModal` discard backdrop/Escape/focus, `0`-item `"Unavailable"` / `"Add Garments"`, `1`-item `54%` + `"No Matching ..."` swap, User A scrub vs User B preserved) **PASS**; `0` non-network console errors / `0` exceptions.
- **Live Backend Checks (`127.0.0.1:5000`):** **`BLOCKED`** (`connect ECONNREFUSED 127.0.0.1:5000`); multi-user HTTP login, `refreshSession 401`, and Express/MongoDB wiring require live backend bring-up (**Vasant**, **Vyshnavi**, **Balaji**).
- **Deferred P2 Frontend Debt & Product Sign-Offs:** Section `12.2 #5` P2 items remain non-blocking polish; Section `9.4` product decisions (**Ali / Mustafa** — taxonomy, Saved vs Favorites policy, Guest import policy, APK/metrics copy, cloud-sync privacy wording, Beta scope) remain open for approval.

---

## 14. Priority 2 (P2) Technical Debt Remediation Summary (November 12, 2026)

> **Status Update:** Following Section `13` (P1 remediation), all **7 deferred P2 frontend items (P2-01..P2-07)** have been implemented on `integrate/frontend-into-main` (uncommitted working tree atop `4ae9f4e`) while preserving all Phases 1–5 and P1 guarantees intact.

### 14.1 Files Added & Updated in P2 Pass
- **Shared Utilities & Adapters:**
  - `web/src/utils/measurementUtils.ts` *(new — pure measurement parsing, `cm` <-> `ft/in` & `kg` <-> `lbs` conversion, normalization, and optional validation helpers)*
  - `web/src/adapters/profile.adapter.ts` *(P2-04: `preferredCategories` `'footwear'` <-> `'shoes'` bidirectional mapping & sanitization)*
  - `web/src/utils/imageCompressor.ts` *(P2-02: `validateGarmentImageFile` gate before fallback, `#FFFFFF` transparent-PNG JPEG canvas backdrop, `compressImageFileWithMeta`)*
  - `web/src/utils/focusTrap.ts` *(P2-05: ref-counted `acquireBodyScrollLock` / `getActiveScrollLockCount` and `isConnected` restore guard)*
- **Components & Studio Flows:**
  - `OnboardingModal.tsx`, `UserProfileModal.tsx` *(P2-01 unit sync via `otd:settings-updated`, Weight field in Profile, optional non-blocking validation; P2-06 `<380px` grids)*
  - `ClosetUploadView.tsx`, `EditPieceModal.tsx` *(P2-02 fallback notice; P2-03 scope-guarded `persistActiveDrafts`, `role="alert"` **Draft Auto-Save Failed** banner + **Retry Save** / accurate storage status)*
  - `Navbar.tsx`, `Hero.tsx`, `MobileBottomNav.tsx`, `StudioRouteGuard.tsx`, `SettingsModal.tsx`, `OutfitActionToolbar.tsx`, `GarmentConstraintsSection.tsx`, `AppStudio.tsx` *(P2-06 `320×640` overflow fixes & `44px` guard button)*
  - `InteractiveStylist.tsx`, `GapIntelligence.tsx`, `Pillars.tsx`, `GarmentSwapModal.tsx`, `AppStudio.tsx` *(P2-07 clear Demo/Roadmap copy & dynamic `${allSlots.length - 1}` locked slot count)*

### 14.2 Post-P2 Verification Summary
- **Static & Build (`BypassSandbox: false`):** `tsc --strict --noEmit` (`0` errors), `oxlint` (`0` errors across `91` files; `5` pre-existing warnings), `vite build` (`1,996` modules, `3.51s`, main bundle `475.70 kB` / `137.86 kB` gzip).
- **Unit & Chromium CDP (`BypassSandbox: true`):** `20/20` unit assertions **PASS**; **72 / 72** route × viewport matrix (`320×640`–`1440×900`, `0px` overflow, `0` broken images) + `320×640` modals & screenshots **PASS**; interactive P2-01..P2-07 flows (under guest mode and CDP `/api/*` stub where backend is offline) **PASS** with `0` uncaught page exceptions.
- **Live Backend (`127.0.0.1:5000`):** Remains **`BLOCKED`** (`connect ECONNREFUSED 127.0.0.1:5000`); server-side round-trip verification awaits backend bring-up alongside Section `9.2`–`9.5` external dependencies.






