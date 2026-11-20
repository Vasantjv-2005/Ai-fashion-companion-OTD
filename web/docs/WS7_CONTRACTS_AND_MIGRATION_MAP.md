# OTD Frontend — WS7 Domain Models, API DTOs & Adapter Contracts

**Workspace:** `web/`  
**Status:** Implemented & verified (WS7 only; existing React components remain intentionally intact for WS3–WS6 migration).  
**Sources Verified Read-Only:** `AI-FASHION-OTD/src/` models, validators, controllers, services, routes, and AI integration types.

---

## 1. Architecture & Dependency Boundaries

WS7 separates frontend business/UI types from raw Express/Mongoose wire payloads across three isolated layers:

| Layer | Directory | Responsibility | Import Rules |
| :--- | :--- | :--- | :--- |
| **API DTOs** | `src/types/api/` | Exact backend/AI wire contracts (tolerating `_id`/`id`, `total`/`totalItems`, `.strict()` Zod validators, and `@pendingExternalContract` notes). | May only import within `src/types/api/`. Zero runtime code. |
| **Domain Models** | `src/types/domain/` | Clean UI & business models tailored for OTD Web components (`ClosetGarment`, `SavedLook`, `SynthesizedOutfitEnsemble`, `UserStyleProfile`, etc.). | May only import within `src/types/domain/`. Zero runtime code. |
| **Adapters** | `src/adapters/` | Pure stateless mapping, normalization, `.strict()` request sanitization, ID partitioning, and defensive fallbacks. | May only import `../types/api/*`, `../types/domain/*`, and `./shared.adapter`. **Never** imports `context/`, `components/`, or `services/`. |

---

## 2. Explicit Data Contract Reconciliations

### 2.1 `footwear` vs `shoes` & Garment Categories
- **Frontend Domain (`GarmentCategory`):** Preserves `'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories'` as `CoreClosetCategory` plus `'dresses' | 'activewear' | 'ethnic-wear' | 'other'` (`ExtendedGarmentCategory`) so backend items never suffer silent truncation.
- **Backend (`BackendClothingCategoryDto`):** Uses `'shoes'` instead of `'footwear'`.
- **Adapter Rule (`shared.adapter.ts` / `wardrobe.adapter.ts`):**
  - Frontend -> Backend (`mapCategoryToBackend`): `'footwear' -> 'shoes'`.
  - Backend -> Frontend (`normalizeCategoryToDomain`): `'shoes' | 'shoe' | 'footwear' -> 'footwear'`.
  - **UI Bug Guard:** `OutfitSlotsList.tsx` currently falls back to singular `slot.slot` (`'bottom'`, `'footwear'`, `'accessory'`) when adding items to the wishlist. `normalizeCategoryToDomain()` repairs singular/plural variants automatically into canonical closet buckets (`'bottoms'`, `'footwear'`, `'accessories'`).

### 2.2 `subType` vs `style`
- **Frontend (`ClosetGarment`):** Uses structural silhouette strings in `subType` (`'Oxford Shirt'`, `'Pleated Trousers'`, `'Leather Loafers'`) alongside numeric `formality` (`1..5`) and `occasions: string[]`.
- **Backend (`WardrobeItem`):** Requires normalized `style: BackendClothingStyleDto` (`'casual' | 'formal' | 'smart-casual' | 'streetwear' | 'sporty' | 'traditional' | 'party' | 'minimalist' | 'other'`) and **has no `subType` column**.
- **Adapter Rule (`wardrobe.adapter.ts`):**
  - Domain `ClosetGarment` carries both `subType: string` (UI silhouette) and `style: GarmentStyleTag`.
  - `inferStyleFromGarment()` derives valid backend `style` from `garment.style ?? formality + subType + occasions`.
  - `inferFormalityFromStyle()` derives `FormalityTier` (`1..5`) when hydrating backend `WardrobeItem` DTOs into `ClosetGarment`, assigning safe default silhouette labels by category.

### 2.3 `height` vs `heightCm` (and `weight`)
- **Frontend (`UserProfile`):** Stores display string `height` (e.g., `"5'11\" (180 cm)"`, `"5'10\""`, `"178 cm"`) and `weight` (`"168 lbs"`).
- **Backend (`Profile` / `updateProfileSchema.strict()`):** Requires numeric `heightCm?: number` (`50..300`). Does **not** have `weight`, `wardrobeFocus`, `avatarOption`, `avatarArchetype`, or `referencePhotoUrl`.
- **Adapter Rule (`profile.adapter.ts`):**
  - `UserStyleProfile` carries both `heightDisplay` and structured `heightCm`.
  - `parseHeightToCm()` parses explicit `cm`, `feet'inches"`, `ft/in`, and bare numbers within `50..300`.
  - `mapProfileDomainToUpdateDto()` enforces exact `updateProfileSchema.strict()` keys and strips all client-only atelier fields so `PATCH /api/profile` will not return HTTP 400.

### 2.4 `stylePersonas` vs `preferredStyles` (and `preferredFit`)
- **Frontend:** `UserProfileModal` & `OnboardingModal` mix 8 editorial persona strings (`'Old Money Heritage'`, `'Clean Minimalist'`, `'Smart Sartorial'`, `'Relaxed Contemporary'`, `'Streetwear Chic'`, `'Quiet Luxury'`, `'Evening Haute'`, `'Capsule Modular'`) and 4 inconsistent fit label conventions (`Slim` / `Tailored / Slim` / `Slim Fit`, `Regular` / `Regular Classic` / `Regular Fit` / `Regular Tailored`, `Relaxed / Tailored` / `Relaxed / Drape`, `Loose Fit`).
- **Backend (`Profile` & `UserPreference`):** Both enforce 9 `preferredStyles` enums (`'casual' | 'formal' | 'smart-casual' | 'streetwear' | 'sporty' | 'traditional' | 'party' | 'minimalist' | 'other'`) and `UserPreference.preferredFit` enforces `'slim' | 'regular' | 'relaxed' | 'oversized' | 'no-preference'`.
- **Adapter Rule (`profile.adapter.ts`, `preferences.adapter.ts`, `shared.adapter.ts`):**
  - `mapStylePersonasToBackendStyles()` / `mapBackendStylesToPersonas()` cleanly translate between editorial personas and backend enums.
  - `normalizeFitToDomain()` / `mapFitToBackendPreference()` collapse all 4 UI fit string conventions into backend-valid enums.

### 2.5 Outfit `clothingItemIds` vs `wardrobeItemIds`
- **Confirmed Backend Mismatch:**
  - `outfits.validator.ts` (`createOutfitSchema.strict()`, `updateOutfitSchema.strict()`) requires `clothingItemIds: ObjectId[]`.
  - `models/Outfit.ts`, `models/OutfitGeneration.ts`, `models/OutfitHistory.ts`, and `outfits.types.ts` define `wardrobeItemIds: ObjectId[]` (plus `isFavorite: boolean`), omitting `clothingItemIds`, `status`, `colorPalette`, `aiGenerated`, `rating`.
- **Domain & Adapter Resolution (`outfit.dto.ts`, `outfit.adapter.ts`):**
  - Domain `OutfitRecord` uses `garmentIds: string[]`.
  - `extractOutfitItemIds()` reads `dto.wardrobeItemIds ?? dto.clothingItemIds ?? []`.
  - `mapOutfitRecordToCreateDto()` filters out non-ObjectId guest/local IDs (`partitionMongoItemIds()`) and emits `clothingItemIds` matching current Zod validators, returning `{ dto: null, skippedLocalIds }` if zero persisted items exist.

### 2.6 Saved Look Identifiers (`localId` vs `backendOutfitId`)
- **Problem:** Frontend currently uses string slugs (`'saved-1'`, `'saved-4'`, `'saved-17100...'`) and mixes editorial card IDs (`'sug-1'`, `'idea-3'`) into `otd_liked_looks`. Sending `'saved-1'` to `PATCH /api/outfits/:id` or `DELETE /api/outfits/:id` will fail backend ObjectId validation (`400 Invalid ID`).
- **Resolution (`savedLook.ts`, `savedLook.adapter.ts`):**
  - `SavedLook` cleanly separates `id` (local UI key), `backendOutfitId?: string` (only set when 24-hex ObjectId verified), `sourceTemplateId?: string`, and `sourceKind: 'curated-default' | 'stylist-generated' | 'api-outfit'`.
  - `resolveSavedLookIdentifier()` and `classifyLikedLookId()` guard backend calls so only persisted ObjectIds trigger authenticated `/api/outfits/*` requests.

### 2.7 Color Taxonomy
- **Frontend (`ClosetUploadView.tsx`, `AvatarOutfitCanvas.tsx`):** Compound editorial labels (`Charcoal Noir`, `Vicuna Camel`, `Navy Midnight`, `Oatmeal Beige`, `Olive Forest`, `Burgundy Noir`, `Chalk White`, `Cognac Brown`) + `getGarmentHex()` SVG shading.
- **Backend / AI:** Plain color strings (`maxlength: 50`, lowercased on `ShoppingRecommendation`, `WardrobeGap`, `UserVibe`).
- **Resolution (`shared.adapter.ts`):** `CORE_PALETTE_SWATCHES` and `resolveColorProfile()` normalize any compound label or CSS hex into `{ displayName, baseToken, hex }`, enabling consistent avatar rendering and backend search filtering.

### 2.8 AI Garment Recognition Output (`AiClothingRecognitionResponseDto` -> `GarmentDraftItem`)
- **Backend Internal Service (`clothing-recognition.service.ts`):** Validates predictions with `category` (17 granular tokens: `shirt`, `tshirt`, `top`, `blouse`, `trousers`, `jeans`, `shorts`, `skirt`, `dress`, `jacket`, `coat`, `sweater`, `hoodie`, `suit`, `shoes`, `accessory`, `other`), `color?`, `secondaryColor?`, `material?`, `pattern?`, `style?`, `season?`, `occasions?`, `confidence: 0..1`, and returns `{ predictions, modelVersion?, requestId?, requiresUserConfirmation: true }`.
- **Adapter Rule (`wardrobe.adapter.ts`):**
  - `mapAiPredictionToRecognitionCandidate()` maps granular AI category -> `{ suggestedCategory, suggestedSubType, suggestedStyle, seasons, isLowConfidence: confidence < 0.65 }`.
  - `mapRecognitionCandidateToDraftItem()` converts confirmed candidates into editable `GarmentDraftItem` drafts for `ClosetUploadView`.
  - Preserves `requiresUserConfirmation: true` so predicted garments are never auto-saved without user review.

### 2.9 Outfit Generation Request & Response
- **Verified Backend Paths:**
  1. `POST /api/outfits/generate` (`outfits.controller.ts`): accepts `GenerateOutfitsRequestDto { occasion?, requestedStyle?, season?, excludedItemIds?, preferredColor?, includeAccessories? }`; returns `{ recommendations: [{ itemIds, explanation, score }], total, processingTimeMs }`.
  2. `POST /api/ai/pipeline` (`ai.controller.ts`): accepts `AiOutfitPipelineRequestDto { occasion?, season?, style?, location?, coordinates?: { latitude, longitude }, excludedItemIds?, preferredColor? }`; returns `{ outfits, weatherContext?, pipelineSteps }`.
- **Gap vs Frontend Interactive Stylist:** Neither endpoint yet accepts Step 1–3 wizard fields (`mustIncludeItemIds`, `mustIncludeKeywords`, `avoidKeywords`, `moods`, `venueName`, `venueCategory`, `scheduledDate`, `scheduledTime`) or returns per-slot missing/gap shoppable suggestions. Those are explicitly typed under `@pendingExternalContract` in `src/types/api/ai.dto.ts`.

---

## 3. Verified Backend Issues & Open Questions for Vasant (Backend)

1. **`Outfits` Validator vs Mongoose Schema Mismatch (Blocking `POST /api/outfits` & `PATCH /api/outfits/:id`):**
   - `outfits.validator.ts` requires `clothingItemIds` and uses `.strict()`, whereas `models/Outfit.ts` requires `wardrobeItemIds` and defines `isFavorite` instead of `status`/`clothingItemIds`/`rating`/`aiGenerated`/`colorPalette`. Creating an outfit via HTTP currently drops `clothingItemIds` in Mongoose and fails schema validation on missing `wardrobeItemIds`.
2. **Unmounted Public Routes Needed by Frontend:**
   - Clothing Recognition endpoint (internal `clothing-recognition.service.ts` exists, no HTTP route mounted on `/api/wardrobe/recognize` or `/api/ai/recognize`).
   - Wardrobe Image Retrieval endpoint (`POST/DELETE /api/wardrobe/:id/image` exist, no `GET /api/wardrobe/:id/image` stream/signed URL endpoint exists to hydrate uploaded photos).
   - `OutfitRating` (`models/OutfitRating.ts` exists, no route mounted in `outfits.routes.ts`).
   - `stylistAdviceSchema` (`ai.validator.ts` exists, no route mounted in `ai.routes.ts`).
3. **Wire Consistency Differences Handled Defensively by Frontend Adapters:**
   - `_id` vs `id`: `wardrobe` and `events` serialize `id`, whereas `profile`, `preferences`, `outfits`, `shopping`, `venues`, `vibes`, `avatar`, `ai`, and `wardrobe-intelligence/gaps` return raw Mongoose `_id`.
   - `pagination.totalItems` vs `pagination.total`: `wardrobe` & `events` return `totalItems`; `outfits`, `shopping`, `venues`, `outfits/history` return `total`.
   - `weather.validator.ts` expects query params `?lat=...&lon=...` while `ai.validator.ts` expects `{ coordinates: { latitude, longitude } }`.

---

## 4. Unverified / Pending AI & ML Contracts for Chodhita (AI Team)

Typed cleanly with `@pendingExternalContract` / `@pendingPublicRoute`:
1. **Garment Recognition HTTP Contract:** Confirm final response fields (`material` vs `fabric`, garment `fit`, numeric `formality`, background-removed `cutoutImageUrl`, and multi-item bounding boxes when a photo shows head-to-toe outfits).
2. **Stylist Pipeline Request/Response Enrichment (`POST /api/ai/pipeline` & `/api/ai/refine`):**
   - Request fields currently captured in Web Studio Step 1–3: `mustIncludeItemIds`, `mustIncludeKeywords`, `avoidKeywords`, `moods`, `venueName`, `venueCategory`, `scheduledDate`, `scheduledTime`, `weatherOverride`.
   - Response fields needed by `AvatarOutfitCanvas` & `OutfitRationaleCard`: slot assignment (`top | outerwear | bottom | footwear | accessory`), owned-vs-missing status, suggested gap piece price/color/category, and structured rationale (`colorHarmony`, `styleAlignment`, `dressCodeNote`, `weatherNote`).

---

## 5. Planned Migration Map for WS3–WS6

Existing components and contexts remain **untouched in WS7** so production demo flows keep working. Future workstreams should adopt the new types and adapters in these exact targets:

| Workstream | Target Files to Migrate | WS7 Contracts to Adopt |
| :--- | :--- | :--- |
| **WS3 — Saved Looks Data Integrity** | `src/components/AppStudio.tsx` (`SavedLookItem`, `DEFAULT_SAVED_LOOKS`, `likedLooks`, `toggleSaveLook`), `src/components/Lookbook.tsx` | `SavedLook`, `SavedLookIdentifier`, `LikedLookReference`, `resolveSavedLookIdentifier`, `classifyLikedLookId`, `mapBackendOutfitToSavedLook`, `mapSavedLookToCreateOutfitDto` |
| **WS4 — Digital Closet Schema & Editing** | `src/context/ClosetContext.tsx` (`ClosetItem`), `src/components/ClosetUploadView.tsx`, `src/components/AddPieceModal.tsx`, `src/components/EditPieceModal.tsx`, `src/utils/draftStorage.ts`, `src/utils/duplicateDetector.ts` | `ClosetGarment`, `GarmentDraftItem`, `GarmentRecognitionDraftResult`, `GarmentImageUploadAsset`, `mapWardrobeItemDtoToDomain`, `mapClosetGarmentToCreateDto`, `mapClosetGarmentToUpdateDto`, `mapRecognitionResponseToDraftResult` |
| **WS5 — Stylist Workflow Bugs & Shopping Mapping** | `src/components/AppStudio.tsx` (Step 1–3 wizard, calendar, destinations), `src/components/InteractiveStylist.tsx`, `src/utils/outfitSynthesizer.ts`, `src/components/ui/{OutfitSlotsList,AvatarOutfitCanvas,GarmentSwapModal,OutfitResultHeader,OutfitRationaleCard}.tsx`, `src/components/ShoppingListView.tsx`, `src/components/GapIntelligence.tsx`, `src/components/UserProfileModal.tsx`, `src/components/OnboardingModal.tsx` | `SynthesizedOutfitEnsemble`, `OutfitGenerationCriteria`, `OutfitRecord`, `WishlistItem`, `WardrobeGapItem`, `UserStyleProfile`, `StylePreferences`, `ScheduledEvent`, `VenuePlace`, `WeatherContext`, `normalizeCategoryToDomain`, `mapEnsembleToCreateOutfitDto`, `mapWishlistItemToCreateDto` |
| **WS6 — Responsive UI & Broken Image Handling** | Image rendering surfaces in `WardrobeStudio.tsx`, `ClosetUploadView.tsx`, `GarmentSwapModal.tsx`, `AppStudio.tsx`, `AvatarOutfitCanvas.tsx` | Use `GarmentImageUploadAsset` & resilient fallback resolvers (`resolveColorProfile`, `DEFAULT_VENUE_IMAGE`, category icons) instead of raw unvalidated URLs |

