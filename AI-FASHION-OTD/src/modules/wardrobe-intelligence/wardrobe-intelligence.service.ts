import {
  AIClientError,
  aiUploadFile,
} from "../../integrations/ai/ai.client";

import type {
  ClothingItemInference,
  ClothingReviewStatus,
} from "../wardrobe/wardrobe.types";

import { validateFashionClipResponse } from "./wardrobe-intelligence.validator";

interface UploadedClothingImage {
  buffer: Uint8Array;
  originalname: string;
  mimetype: string;
}

export function getReviewStatus(
  confidence: number,
): ClothingReviewStatus {
  if (confidence >= 0.8) {
    return "suggested";
  }

  if (confidence >= 0.55) {
    return "needs_attribute_review";
  }

  return "needs_user_review";
}

export function prepareClothingInference(
  inference: ClothingItemInference,
): ClothingItemInference {
  return {
    ...inference,
    name: inference.name.trim(),
    color: inference.color.trim().toLowerCase(),
    secondaryColor:
      inference.secondaryColor?.trim().toLowerCase() ?? null,
  };
}

export async function recognizeClothingImage(
  file: UploadedClothingImage,
) {
  const rawResponse = await aiUploadFile("predict", {
    buffer: file.buffer,
    filename: file.originalname,
    mimeType: file.mimetype,
  });

  const result = validateFashionClipResponse(rawResponse);

  if (!result.success) {
    throw new AIClientError(
      "AI service returned an invalid response.",
      502,
    );
  }

  return {
    requiresUserConfirmation: true,
    prediction: result.data.data,
  };
}
