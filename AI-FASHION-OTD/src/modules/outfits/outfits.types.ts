import type { Types } from "mongoose";
import type { OutfitSeason, OutfitStyle } from "../../models/Outfit";
import type { PaginationMeta } from "../../types/common.types";

export interface OutfitItemReference {
    wardrobeItemId: string;
    category?: string;
}

export interface CreateOutfitData {
    name: string;
    clothingItemIds: string[];
    description?: string;
    occasion?: string;
    season?: OutfitSeason;
    style?: OutfitStyle;
    isFavorite?: boolean;
    notes?: string;
}

export interface UpdateOutfitData {
    name?: string;
    clothingItemIds?: string[];
    description?: string;
    occasion?: string;
    season?: OutfitSeason;
    style?: OutfitStyle;
    isFavorite?: boolean;
    notes?: string;
    wornAt?: Date;
}

export interface OutfitResponseData {
    id: string;
    userId: string;
    name: string;
    description: string;
    wardrobeItemIds: string[];
    occasion: string;
    style: OutfitStyle;
    season: OutfitSeason;
    isFavorite: boolean;
    notes: string;
    wornAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface OutfitListOptions {
    page?: number;
    limit?: number;
    occasion?: string;
    season?: string;
    style?: string;
    isFavorite?: boolean;
    search?: string;
    sortBy?: "createdAt" | "name" | "wornAt";
    sortOrder?: "asc" | "desc";
}

export interface PaginatedOutfitsResponse {
    items: OutfitResponseData[];
    pagination: PaginationMeta;
}

export interface LogOutfitWearInput {
    outfitId?: string;
    outfitName?: string;
    wardrobeItemIds?: string[];
    occasion?: string;
    wornAt?: Date;
    notes?: string;
    rating?: number;
    feedback?: string;
}

export interface OutfitGenerationRequest {
    occasion?: string;
    requestedStyle?: string;
    season?: string;
    excludedItemIds?: string[];
    preferredColor?: string;
    includeAccessories?: boolean;
}

