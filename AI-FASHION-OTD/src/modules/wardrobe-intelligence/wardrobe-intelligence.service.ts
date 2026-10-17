
import type {
  ClothingItemInference,
  ClothingReviewStatus,
} from "../wardrobe/types";

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
