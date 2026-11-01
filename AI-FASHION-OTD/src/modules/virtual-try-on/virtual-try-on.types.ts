import type { VirtualTryOnStatus, VirtualTryOnType } from "../../models/VirtualTryOn";

export interface CreateTryOnRequest {
    wardrobeItemIds: string[];
    userImageUrl?: string;
    tryOnType?: VirtualTryOnType;
    prompt?: string;
}

export interface VirtualTryOnResponse {
    id: string;
    userId: string;
    wardrobeItemIds: string[];
    tryOnType: VirtualTryOnType;
    userImageUrl: string;
    generatedImageUrl?: string;
    status: VirtualTryOnStatus;
    aiProvider?: string;
    errorMessage?: string;
    processingTimeMs?: number;
    createdAt: Date;
    updatedAt: Date;
}

