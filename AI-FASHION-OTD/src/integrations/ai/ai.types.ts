
/**
 * AI Fashion Companion
 * Shared types for communication between the Node.js backend
 * and the AI/ML service.
 */

/** Supported clothing categories returned by the AI model. */
export type ClothingCategory =
    | "shirt"
    | "tshirt"
    | "top"
    | "blouse"
    | "trousers"
    | "jeans"
    | "shorts"
    | "skirt"
    | "dress"
    | "jacket"
    | "coat"
    | "sweater"
    | "hoodie"
    | "suit"
    | "shoes"
    | "accessory"
    | "other";

/** Confidence score must be between 0 and 1. */
export interface ClothingPrediction {
    category: ClothingCategory;
    color?: string;
    secondaryColor?: string;
    material?: string;
    pattern?: string;
    style?: string[];
    season?: string[];
    occasions?: string[];
    confidence: number;
}

/** Input sent to the clothing recognition service. */
export interface ClothingRecognitionRequest {
    imageUrl?: string;
    imageBase64?: string;
    mimeType?: string;
}

/** Output returned by the clothing recognition service. */
export interface ClothingRecognitionResponse {
    predictions: ClothingPrediction[];
    modelVersion?: string;
    requestId?: string;
}

/** Weather information used for outfit recommendations. */
export interface OutfitWeatherContext {
    temperatureC?: number;
    condition?: string;
    humidity?: number;
}

/** One outfit suggested by the AI service. */
export interface OutfitRecommendation {
    itemIds: string[];
    explanation: string;
    score?: number;
}

/** Input sent to the outfit recommendation service. */
export interface OutfitRecommendationRequest {
    wardrobeItems: Array<{
        id: string;
        category: string;
        color?: string;
        style?: string[];
        season?: string[];
    }>;
    occasion?: string;
    weather?: OutfitWeatherContext;
    preferredStyles?: string[];
    excludedItemIds?: string[];
    previousOutfitItemSets?: string[][];
}

/** Output returned by the outfit recommendation service. */
export interface OutfitRecommendationResponse {
    recommendations: OutfitRecommendation[];
    modelVersion?: string;
    requestId?: string;
}

/** Context for refining an existing outfit recommendation. */
export interface OutfitRefinementRequest {
    message: string;
    previousRecommendationIds: string[];
    preferredStyles?: string[];
    excludedItemIds?: string[];
}

/** Generic error format, if supported by the AI service. */
export interface AiServiceErrorResponse {
    message: string;
    code?: string;
    requestId?: string;
}
