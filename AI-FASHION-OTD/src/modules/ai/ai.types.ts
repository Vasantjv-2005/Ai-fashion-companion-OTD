import type { AIMessageRole } from "../../models/AIMessage";
import type { AIConversationStatus } from "../../models/AIConversation";
import type { OutfitRecommendation } from "../../integrations/ai/ai.types";

export interface AIConversationResponse {
    id: string;
    userId: string;
    title: string;
    status: AIConversationStatus;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface AIMessageResponse {
    id: string;
    userId: string;
    conversationId: string;
    role: AIMessageRole;
    content: string;
    aiProvider?: string;
    modelName?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export interface SendMessageInput {
    conversationId?: string;
    content: string;
    metadata?: Record<string, unknown>;
}

export interface StylistAdviceRequest {
    message: string;
    occasion?: string;
    season?: string;
    style?: string;
    conversationId?: string;
}

export interface StylistAdviceResponse {
    reply: string;
    conversationId: string;
    suggestedOutfits?: OutfitRecommendation[];
    detectedPreferences?: {
        styles?: string[];
        colors?: string[];
    };
}

export interface OutfitPipelineInput {
    occasion?: string;
    season?: string;
    style?: string;
    location?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    excludedItemIds?: string[];
    preferredColor?: string;
}

export interface OutfitPipelineResult {
    outfits: OutfitRecommendation[];
    weatherContext?: {
        temperatureC?: number;
        condition?: string;
        description?: string;
    };
    pipelineSteps: {
        totalWardrobeItems: number;
        candidatesEvaluated: number;
        validatedOutfits: number;
        processingTimeMs: number;
    };
}

