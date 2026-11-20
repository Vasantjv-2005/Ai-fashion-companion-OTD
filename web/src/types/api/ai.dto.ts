/**
 * Backend & AI/ML API DTO contracts for Stylist Conversations, Messages,
 * Outfit Intelligence Pipeline, and Virtual Try-On.
 * Mirrors AI-FASHION-OTD/src/models/{AIConversation,AIMessage,VirtualTryOn}.ts,
 * modules/ai/*, and integrations/ai/ai.types.ts.
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';
import type { OutfitRecommendationItemDto } from './outfit.dto';

export type BackendAiConversationStatusDto = 'active' | 'archived';

export interface BackendAiConversationDto extends MongoRecordDto {
  userId: ObjectIdString;
  title: string;
  status: BackendAiConversationStatusDto;
  lastMessageAt: IsoDateString | null;
}

export interface CreateAiConversationRequestDto {
  title?: string;
}

export type BackendAiMessageRoleDto = 'user' | 'assistant' | 'system';

export interface BackendAiMessageDto extends MongoRecordDto {
  userId: ObjectIdString;
  conversationId: string;
  role: BackendAiMessageRoleDto;
  content: string;
  aiProvider?: string;
  modelName?: string;
  promptTokens?: number;
  completionTokens?: number;
  responseTimeMs?: number;
  metadata?: Record<string, unknown>;
  isDeleted?: boolean;
}

export interface SendAiChatRequestDto {
  conversationId?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

/** Returned inside `data` by `POST /api/ai/chat`. Notice `ai.service.ts` returns `{ conversationId, message }`. */
export interface SendAiChatResponseDto {
  conversationId: string;
  message: BackendAiMessageDto | string;
  reply?: string;
}

/** Validated by `outfitPipelineSchema` on `POST /api/ai/pipeline`. */
export interface AiOutfitPipelineRequestDto {
  occasion?: string;
  season?: string;
  style?: string;
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  excludedItemIds?: ObjectIdString[];
  preferredColor?: string;
}

export interface AiOutfitPipelineWeatherContextDto {
  temperatureC?: number;
  condition?: string;
  description?: string;
}

export interface AiOutfitPipelineStepsDto {
  totalWardrobeItems: number;
  candidatesEvaluated: number;
  validatedOutfits: number;
  processingTimeMs: number;
}

export interface AiOutfitPipelineResultDto {
  outfits: OutfitRecommendationItemDto[];
  weatherContext?: AiOutfitPipelineWeatherContextDto;
  pipelineSteps: AiOutfitPipelineStepsDto;
}

/**
 * Validated by `stylistAdviceSchema` in `ai.validator.ts`.
 * @pendingPublicRoute Defined in validator & `ai.types.ts`, not yet mounted in `ai.routes.ts`.
 */
export interface AiStylistAdviceRequestDto {
  message: string;
  occasion?: string;
  season?: string;
  style?: string;
  conversationId?: string;
}

/** @pendingPublicRoute */
export interface AiStylistAdviceResponseDto {
  reply: string;
  conversationId: string;
  suggestedOutfits?: OutfitRecommendationItemDto[];
  detectedPreferences?: {
    styles?: string[];
    colors?: string[];
  };
}

/** Mirrors `OutfitRefinementRequest` in `integrations/ai/ai.types.ts`. */
export interface AiOutfitRefinementRequestDto {
  message: string;
  previousRecommendationIds: string[];
  preferredStyles?: string[];
  excludedItemIds?: string[];
}

/**
 * Extended Web Studio AI generation request fields currently built on frontend (`AppStudio` Step 1-3)
 * that do not yet exist in backend `outfitPipelineSchema` or `generateOutfitRecommendations`.
 * @pendingExternalContract Owned by Chodhita (AI/ML) + Vasant (Backend).
 */
export interface PendingAiExtendedGenerationContextDto {
  mustIncludeItemIds?: ObjectIdString[];
  mustIncludeKeywords?: string[];
  avoidKeywords?: string[];
  moods?: string[];
  venueName?: string;
  venueCategory?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  weatherOverride?: string;
  preferenceTags?: string[];
  allowMissingPieceSuggestions?: boolean;
}

/**
 * Extended per-slot / missing-piece metadata needed to render the full Interactive Stylist
 * 5-slot canvas & gap recommendations directly from backend AI output.
 * @pendingExternalContract Owned by Chodhita (AI/ML) + Vasant (Backend).
 */
export interface PendingAiSlotRecommendationDto {
  slot: 'top' | 'outerwear' | 'bottom' | 'footwear' | 'accessory';
  wardrobeItemId?: ObjectIdString;
  ownershipStatus: 'owned' | 'missing';
  suggestedItemName?: string;
  suggestedColor?: string;
  estimatedPrice?: number;
  currency?: string;
  reason?: string;
}

export type BackendVirtualTryOnStatusDto =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type BackendVirtualTryOnTypeDto = 'single_item' | 'full_outfit';

export interface BackendVirtualTryOnDto extends MongoRecordDto {
  userId: ObjectIdString;
  wardrobeItemIds: ObjectIdString[];
  tryOnType: BackendVirtualTryOnTypeDto;
  userImageUrl: string;
  generatedImageUrl?: string;
  status: BackendVirtualTryOnStatusDto;
  aiProvider?: string;
  prompt?: string;
  errorMessage?: string;
  processingTimeMs?: number;
}

