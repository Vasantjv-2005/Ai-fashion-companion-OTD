
import type { Types } from "mongoose";

export const CLOTHING_CATEGORIES = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
    "activewear",
    "ethnic-wear",
    "other",
] as const;

export type ClothingCategory =
    (typeof CLOTHING_CATEGORIES)[number];

export const CLOTHING_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

export type ClothingSeason =
    (typeof CLOTHING_SEASONS)[number];

export const CLOTHING_STYLES = [
    "casual",
    "formal",
    "smart-casual",
    "streetwear",
    "sporty",
    "traditional",
    "party",
    "minimalist",
    "other",
] as const;

export type ClothingStyle =
    (typeof CLOTHING_STYLES)[number];

export interface WardrobeItemAttributes {
    name: string;
    category: ClothingCategory;
    color: string;
    style: ClothingStyle;
    season: ClothingSeason[];
    brand?: string;
    notes?: string;
    imageFileId?: Types.ObjectId | string;
}

export interface CreateWardrobeItemInput
    extends WardrobeItemAttributes { }

export type UpdateWardrobeItemInput =
    Partial<WardrobeItemAttributes>;

export interface WardrobeItemResponse
    extends WardrobeItemAttributes {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface WardrobeListOptions {
    page?: number;
    limit?: number;
    category?: ClothingCategory;
    color?: string;
    style?: ClothingStyle;
    season?: ClothingSeason;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "name";
    sortOrder?: "asc" | "desc";
}

export interface PaginatedWardrobeResponse {
    items: WardrobeItemResponse[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}
