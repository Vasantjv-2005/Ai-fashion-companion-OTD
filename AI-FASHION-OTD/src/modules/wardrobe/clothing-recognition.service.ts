
import {
    recognizeClothing,
} from "../../integrations/ai/clothing-recognition.client";

import type {
    ClothingRecognitionRequest,
} from "../../integrations/ai/ai.types";

import {
    validateWardrobeAttributesList,
    type WardrobeAttributes,
} from "./wardrobe-attributes.validator";

export interface ClothingRecognitionResult {
    predictions: WardrobeAttributes[];
    modelVersion?: string;
    requestId?: string;
    requiresUserConfirmation: true;
}

export async function detectClothingAttributes(
    input: ClothingRecognitionRequest,
    minimumConfidence = 0.65,
): Promise<ClothingRecognitionResult> {
    if (
        !Number.isFinite(minimumConfidence) ||
        minimumConfidence < 0 ||
        minimumConfidence > 1
    ) {
        throw new Error(
            "minimumConfidence must be between 0 and 1.",
        );
    }

    const response = await recognizeClothing(input);

    const validatedPredictions =
        validateWardrobeAttributesList(response.predictions);

    const predictions = validatedPredictions.filter(
        (prediction) => prediction.confidence >= minimumConfidence,
    );

    return {
        predictions,
        modelVersion: response.modelVersion,
        requestId: response.requestId,
        requiresUserConfirmation: true,
    };
}
