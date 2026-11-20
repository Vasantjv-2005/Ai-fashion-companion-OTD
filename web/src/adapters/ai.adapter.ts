/**
 * Bidirectional AI Stylist Conversation, Message, Pipeline, and Refinement adapters.
 */

import type {
  AiOutfitPipelineRequestDto,
  AiOutfitPipelineResultDto,
  AiOutfitRefinementRequestDto,
  AiStylistAdviceResponseDto,
  BackendAiConversationDto,
  BackendAiMessageDto,
  SendAiChatResponseDto,
} from '../types/api';
import type {
  OutfitGenerationCriteria,
  OutfitGenerationSummary,
  StylistAdviceResult,
  StylistChatMessage,
  StylistConversationThread,
} from '../types/domain';
import {
  extractRecordId,
  isRecord,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';
import { mapOccasionToBackendEnum, partitionMongoItemIds } from './outfit.adapter';

export function mapConversationDtoToDomain(
  dto: BackendAiConversationDto,
): StylistConversationThread {
  return {
    id: extractRecordId(dto),
    origin: 'api',
    title: dto.title.trim() || 'Stylist Conversation',
    status: dto.status ?? 'active',
    lastMessageAt: dto.lastMessageAt ? toIsoString(dto.lastMessageAt) : null,
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

export function mapMessageDtoToDomain(dto: BackendAiMessageDto): StylistChatMessage {
  return {
    id: extractRecordId(dto),
    conversationId: dto.conversationId,
    origin: 'api',
    role: dto.role,
    content: dto.content,
    aiProvider: dto.aiProvider,
    modelName: dto.modelName,
    metadata: dto.metadata,
    createdAt: toIsoString(dto.createdAt),
  };
}

export function mapSendChatResponseToMessage(
  dto: SendAiChatResponseDto,
  fallbackId = `ai-msg-${Date.now()}`,
): StylistChatMessage {
  if (isRecord(dto.message)) {
    return mapMessageDtoToDomain(dto.message as unknown as BackendAiMessageDto);
  }

  const textContent =
    typeof dto.message === 'string' && dto.message.trim()
      ? dto.message.trim()
      : typeof dto.reply === 'string'
        ? dto.reply.trim()
        : '';

  return {
    id: fallbackId,
    conversationId: dto.conversationId,
    origin: 'api',
    role: 'assistant',
    content: textContent,
    createdAt: new Date().toISOString(),
  };
}

export function mapCriteriaToPipelineRequestDto(
  criteria: OutfitGenerationCriteria,
): AiOutfitPipelineRequestDto {
  const { validObjectIds } = partitionMongoItemIds(criteria.excludedGarmentIds);
  const season = criteria.season ? normalizeSeasonList([criteria.season])[0] : undefined;

  const dto: AiOutfitPipelineRequestDto = {
    occasion: mapOccasionToBackendEnum(criteria.occasion),
  };

  if (season) dto.season = season;
  if (criteria.style) dto.style = normalizeStyleTag(criteria.style);
  if (criteria.locationLabel?.trim()) dto.location = criteria.locationLabel.trim().slice(0, 200);
  if (criteria.coordinates) {
    dto.coordinates = {
      latitude: criteria.coordinates.latitude,
      longitude: criteria.coordinates.longitude,
    };
  }
  if (validObjectIds.length > 0) {
    dto.excludedItemIds = validObjectIds;
  }
  if (criteria.preferredColor?.trim()) {
    dto.preferredColor = criteria.preferredColor.trim().slice(0, 50);
  }

  return dto;
}

export function mapPipelineResultDtoToSummary(
  dto: AiOutfitPipelineResultDto,
): OutfitGenerationSummary {
  return {
    candidates: (dto.outfits ?? []).map((item) => ({
      garmentIds: normalizeStringArray(item.itemIds),
      explanation: item.explanation || '',
      score: typeof item.score === 'number' ? item.score : undefined,
    })),
    total: dto.pipelineSteps?.validatedOutfits ?? (dto.outfits ?? []).length,
    processingTimeMs: dto.pipelineSteps?.processingTimeMs ?? 0,
    weatherContext: dto.weatherContext,
    pipelineSteps: dto.pipelineSteps,
  };
}

export function mapStylistAdviceDtoToDomain(
  dto: AiStylistAdviceResponseDto,
): StylistAdviceResult {
  return {
    reply: dto.reply,
    conversationId: dto.conversationId,
    candidates: (dto.suggestedOutfits ?? []).map((item) => ({
      garmentIds: normalizeStringArray(item.itemIds),
      explanation: item.explanation || '',
      score: typeof item.score === 'number' ? item.score : undefined,
    })),
    detectedPreferences: dto.detectedPreferences
      ? {
          styles: normalizeStringArray(dto.detectedPreferences.styles),
          colors: normalizeStringArray(dto.detectedPreferences.colors),
        }
      : undefined,
  };
}

export function mapRefinementToRequestDto(input: {
  message: string;
  previousRecommendationIds: readonly string[];
  preferredStyles?: readonly string[];
  excludedGarmentIds?: readonly string[];
}): AiOutfitRefinementRequestDto {
  const { validObjectIds } = partitionMongoItemIds(input.excludedGarmentIds ?? []);
  return {
    message: input.message.trim(),
    previousRecommendationIds: normalizeStringArray(input.previousRecommendationIds),
    preferredStyles:
      input.preferredStyles && input.preferredStyles.length > 0
        ? input.preferredStyles.map((s) => normalizeStyleTag(s))
        : undefined,
    excludedItemIds: validObjectIds.length > 0 ? validObjectIds : undefined,
  };
}

