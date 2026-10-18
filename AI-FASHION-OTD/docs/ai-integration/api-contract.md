# AI Service API Contract

## 1. Purpose

This document defines the expected communication contract between the AI Fashion Companion backend and the separate AI/ML service.

The backend is responsible for authentication, validation, database operations, wardrobe management, outfit validation, and API responses. The AI/ML service is responsible for machine-learning predictions and AI-generated recommendations.

**Important:** These endpoints and payloads are the backend's expected contract. Confirm them with the AI/ML team before connecting the real model.

## 2. Configuration

Configure the following environment variables in the backend:

```env
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT_MS=15000
```

Do not commit production secrets or private service credentials to Git.

## 3. Clothing Recognition

### Endpoint

`POST {AI_SERVICE_URL}/recognize-clothing`

### Request headers

```http
Content-Type: application/json
Accept: application/json
```

### Request body

The request must contain either an image URL or a Base64-encoded image.

Example using an image URL:

```json
{
  "imageUrl": "https://example.com/clothing/shirt.jpg"
}
```

Example using Base64:

```json
{
  "imageBase64": "BASE64_ENCODED_IMAGE_DATA",
  "mimeType": "image/jpeg"
}
```

The AI service must be able to access the supplied image. A private MongoDB GridFS file ID alone is not an image URL; the backend must provide the image data or a suitable, authorized image URL.

### Successful response — HTTP 200

```json
{
  "predictions": [
    {
      "category": "shirt",
      "color": "blue",
      "secondaryColor": "white",
      "material": "cotton",
      "pattern": "striped",
      "style": ["casual", "smart-casual"],
      "season": ["spring", "summer"],
      "occasions": ["college", "daily-wear"],
      "confidence": 0.94
    }
  ],
  "modelVersion": "clothing-model-v1",
  "requestId": "request-001"
}
```

### Supported clothing categories

- `shirt`
- `tshirt`
- `top`
- `blouse`
- `trousers`
- `jeans`
- `shorts`
- `skirt`
- `dress`
- `jacket`
- `coat`
- `sweater`
- `hoodie`
- `suit`
- `shoes`
- `accessory`
- `other`

### Prediction fields

| Field | Type | Description |
|---|---|---|
| `category` | string | Predicted clothing category |
| `color` | string | Main color |
| `secondaryColor` | string | Optional additional color |
| `material` | string | Estimated material |
| `pattern` | string | Pattern such as solid or striped |
| `style` | string array | Style labels |
| `season` | string array | Suitable seasons |
| `occasions` | string array | Suggested occasions |
| `confidence` | number | Confidence from `0` to `1` |

Optional descriptive fields may be omitted. `category` and `confidence` are required.

**User confirmation:** Predictions must be shown to the user for review before being saved as wardrobe attributes.

## 4. Outfit Recommendation Contract

The backend's shared types define the expected outfit recommendation format. Before implementing the production recommendation client, agree on the endpoint path and request/response schema with the AI/ML team.

The request should provide relevant wardrobe items, the occasion, weather information when available, preferred styles, excluded items, and previous outfit combinations.

Example request:

```json
{
  "wardrobeItems": [
    {
      "id": "shirt-001",
      "category": "shirt",
      "color": "blue",
      "style": ["casual"],
      "season": ["summer"]
    },
    {
      "id": "jeans-001",
      "category": "jeans",
      "color": "dark blue",
      "style": ["casual"],
      "season": ["all-season"]
    }
  ],
  "occasion": "college",
  "weather": {
    "temperatureC": 28,
    "condition": "sunny",
    "humidity": 55
  },
  "preferredStyles": ["casual"],
  "excludedItemIds": [],
  "previousOutfitItemSets": []
}
```

Expected response shape:

```json
{
  "recommendations": [
    {
      "itemIds": ["shirt-001", "jeans-001"],
      "explanation": "A casual combination suitable for college.",
      "score": 0.91
    }
  ],
  "modelVersion": "outfit-model-v1",
  "requestId": "request-002"
}
```

The `itemIds` values must refer to the wardrobe item IDs provided in the request. The backend must independently verify ownership, exclusions, duplicate items, and outfit history before returning recommendations.

The recommendation endpoint path, authentication requirements, score meaning, and error schema must be agreed with the AI/ML team.

## 5. Outfit Refinement

The backend may prepare a refinement payload containing the user's message, previous recommendation IDs, preferences, and exclusions.

Example:

```json
{
  "message": "Suggest something more formal.",
  "context": {
    "previousRecommendationIds": ["outfit-001"],
    "preferences": ["formal"],
    "exclusions": []
  }
}
```

The actual AI refinement endpoint and its response format must be confirmed before connecting it to the AI service.

## 6. Error Handling

The clothing recognition client may return the following backend error statuses:

| Status | Meaning |
|---|---|
| `400` | Invalid request or missing image |
| `502` | AI service unavailable, unsuccessful response, or invalid response format |
| `503` | AI service URL is not configured |
| `504` | AI service request timed out |

An upstream non-success response is mapped to `502` by the current client. The backend should avoid exposing internal URLs, credentials, or sensitive stack traces to users.

The AI team should agree on a consistent error response, for example:

```json
{
  "message": "Unable to recognize clothing.",
  "code": "RECOGNITION_FAILED",
  "requestId": "request-003"
}
```

## 7. Timeout and Reliability

- The default AI request timeout is 15 seconds.
- The timeout can be changed using `AI_SERVICE_TIMEOUT_MS`.
- The backend should handle network failures and malformed AI responses.
- Retries should be added only when appropriate and should avoid repeating expensive operations unnecessarily.
- Log request IDs and safe diagnostic details without logging Base64 images, access tokens, or other sensitive data.

## 8. Security Requirements

- Keep the AI service URL and any service credentials in environment variables.
- Validate image size, MIME type, and request payloads before sending data to the AI service.
- Use authenticated and authorized backend routes for user-specific wardrobe operations.
- Do not trust AI-generated item IDs; validate every ID against the user's actual wardrobe.
- Do not automatically save low-confidence predictions without user confirmation.
- Use HTTPS for production service-to-service communication.
- Avoid publicly exposing private wardrobe images through permanent public URLs.

## 9. Integration Checklist

- [ ] Confirm the AI service base URL.
- [ ] Confirm the clothing recognition endpoint path.
- [ ] Confirm accepted image formats and maximum image size.
- [ ] Confirm whether the AI service accepts Base64, URLs, or multipart uploads.
- [ ] Confirm prediction field names, category values, and confidence scale.
- [ ] Confirm outfit recommendation and refinement endpoints.
- [ ] Confirm authentication requirements and error responses.
- [ ] Test valid responses, malformed responses, timeouts, and service failures.
- [ ] Verify that the backend validates AI results before saving or returning them.

## 10. Contract Ownership

The backend team owns this document as the proposed integration contract. The contract is considered finalized only after the backend and AI/ML teams agree on the endpoint paths, payloads, response formats, and error behavior.
