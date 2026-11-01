import type { FashionTrendCategory } from "../../models/FashionTrend";
import type { USER_TREND_INTERACTION_TYPES } from "../../models/UserTrendInteraction";

export interface FashionTrendData {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: FashionTrendCategory;
    season: string;
    year: number;
    colors: string[];
    tags: string[];
    imageUrl?: string;
    sourceName?: string;
    popularityScore: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TrendFilterQuery {
    category?: FashionTrendCategory;
    season?: string;
    year?: number;
    search?: string;
    page?: number;
    limit?: number;
}

export interface TrendInteractionInput {
    trendId: string;
    interactionType: (typeof USER_TREND_INTERACTION_TYPES)[number];
}

