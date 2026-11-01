import type {
    ShoppingRecommendationSource,
    ShoppingRecommendationStatus,
} from "../../models/ShoppingRecommendation";

export interface ShoppingRecommendationData {
    id: string;
    userId: string;
    productName: string;
    brand?: string;
    description?: string;
    category: string;
    color?: string;
    style?: string;
    season?: string;
    productUrl: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    source: ShoppingRecommendationSource;
    status: ShoppingRecommendationStatus;
    recommendationReason?: string;
    relatedWardrobeItemIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateRecommendationData {
    productName: string;
    brand?: string;
    description?: string;
    category: string;
    color?: string;
    style?: string;
    season?: string;
    productUrl: string;
    imageUrl?: string;
    price?: number;
    currency?: string;
    source?: ShoppingRecommendationSource;
    recommendationReason?: string;
    relatedWardrobeItemIds?: string[];
}

export interface ShoppingFilterQuery {
    category?: string;
    status?: ShoppingRecommendationStatus;
    source?: ShoppingRecommendationSource;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

