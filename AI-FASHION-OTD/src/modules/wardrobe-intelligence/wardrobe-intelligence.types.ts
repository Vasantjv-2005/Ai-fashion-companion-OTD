import type { WARDROBE_GAP_PRIORITIES, WARDROBE_GAP_STATUSES } from "../../models/WardrobeGap";
import type { WARDROBE_USAGE_OCCASIONS } from "../../models/WardrobeUsage";

export interface WardrobeAnalytics {
    totalItems: number;
    categories: Record<string, number>;
    styles: Record<string, number>;
    colors: Record<string, number>;
    seasons: Record<string, number>;
    neglectedItemsCount: number;
    mostWornItems: Array<{
        itemId: string;
        name: string;
        wearCount: number;
        lastWorn?: Date;
    }>;
    unwornItems: Array<{
        itemId: string;
        name: string;
        category: string;
        createdAt: Date;
    }>;
}

export interface WardrobeGapResponse {
    id: string;
    userId: string;
    category: string;
    title: string;
    description: string;
    reason: string;
    priority: (typeof WARDROBE_GAP_PRIORITIES)[number];
    status: (typeof WARDROBE_GAP_STATUSES)[number];
    suggestedColors: string[];
    suggestedStyles: string[];
    suggestedSeasons: string[];
    suggestedItemTypes: string[];
    lastAnalyzedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface LogUsageInput {
    wardrobeItemId: string;
    outfitId?: string;
    eventId?: string;
    occasion?: (typeof WARDROBE_USAGE_OCCASIONS)[number];
    usedAt?: Date;
    notes?: string;
}

export interface ItemUsageStatistics {
    itemId: string;
    totalWears: number;
    occasions: Record<string, number>;
    firstWorn?: Date;
    lastWorn?: Date;
}

