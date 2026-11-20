# Phase 2 Centralized API Client Notes

**Scope:** `FE-01` Phase 2 added a shared HTTP client (`web/src/services/api/`) on top of the Phase 1 authentication session architecture and refactored `auth.service.ts` to consume it cleanly. Future domain integrations (wardrobe, profile, outfits, AI) remain out of scope for Phase 2.

---

## 1. Architecture & Module Layout

```text
web/src/
├── services/
│   ├── api/
│   │   ├── api.types.ts     # Shared request/response/error/pagination types
│   │   ├── apiErrors.ts     # ApiError class, proxy/network/HTTP/JSON error parsing
│   │   ├── apiClient.ts     # createApiClient() + default apiClient singleton
│   │   └── index.ts         # Public barrel exports
│   ├── authSession.ts       # Pure in-memory access token, epoch & single-flight mutex
│   ├── auth.service.ts      # Refactored to route auth requests through apiClient
│   └── auth.types.ts        # Re-exported auth domain types (Phase 1 compatibility)
├── adapters/                # Wire DTO -> frontend domain normalization
├── types/
│   ├── api/                 # Backend wire DTO interfaces
│   └── domain/              # Clean frontend domain interfaces
└── context/AuthContext.tsx  # Subscribes to session refresh/invalidation events
```

---

## 2. Key Transport Guarantees

1. **Base URL & Vite Proxy:** Defaults to `VITE_API_BASE_URL || '/api'`, matching `vite.config.ts` `/api` dev proxy and backend `/api/*` mount paths.
2. **Methods & Serialization:** Supports typed `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `request`, and `requestWithMeta`. Automatically serializes JSON objects/query params, preserves `FormData` without setting `Content-Type` (allowing browser multipart boundaries for future uploads), and safely handles `204 No Content` / empty responses.
3. **Auth Token Injection & Credentials:** Reads the short-lived `accessToken` strictly from module memory (`authSession.ts`) and attaches `Authorization: Bearer <token>` only to same-API-origin requests. Uses `credentials: 'include'` so HttpOnly refresh cookies flow seamlessly across `/api/auth/*` and protected routes.
4. **401 Recovery Without Retry Loops:**
   - Only `401` triggers the existing `runSingleFlightRefresh` (`POST /api/auth/refresh`), retrying the original request **at most once** with the rotated token.
   - `403 Forbidden` is never automatically treated as session expiry and does not trigger refresh.
   - Refresh requests carry `skipAuthRefresh: true`, preventing recursive loops if `/auth/refresh` returns `401`/`400`/network error.
   - When refresh fails, the **original `ApiError` is preserved** and thrown cleanly. If refresh fails with a terminal auth rejection (`400`/`401`/`403`) on an active authenticated session, `AuthContext` clears private user caches without deleting Guest Demo data.
5. **Timeouts & Cancellation:** Every attempt uses an independent `AbortController` timer linked cleanly to any caller `AbortSignal`, distinguishing `TIMEOUT` vs caller `ABORTED` vs `NETWORK_ERROR` vs `MALFORMED_RESPONSE`.

---

## 3. Service Pattern for Future Domains (Phases 3+)

When future phases add `wardrobe.service.ts`, `profile.service.ts`, or `outfits.service.ts`:
- Import `apiClient` and `isApiError` from `./api`.
- Check `canMakeProtectedRequests` / `isAuthenticated` before calling protected backend endpoints so Guest Demo Mode stays strictly offline/local.
- Define backend request/response wire DTOs under `src/types/api/` and map them via `src/adapters/` into `src/types/domain/` types instead of coupling UI components to wire schemas.

