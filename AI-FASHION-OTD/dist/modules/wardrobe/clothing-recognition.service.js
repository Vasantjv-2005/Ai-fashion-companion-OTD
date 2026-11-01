"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectClothingAttributes = detectClothingAttributes;
const clothing_recognition_client_1 = require("../../integrations/ai/clothing-recognition.client");
const wardrobe_attributes_validator_1 = require("./wardrobe-attributes.validator");
async function detectClothingAttributes(input, minimumConfidence = 0.65) {
    if (!Number.isFinite(minimumConfidence) ||
        minimumConfidence < 0 ||
        minimumConfidence > 1) {
        throw new Error("minimumConfidence must be between 0 and 1.");
    }
    const response = await (0, clothing_recognition_client_1.recognizeClothing)(input);
    const validatedPredictions = (0, wardrobe_attributes_validator_1.validateWardrobeAttributesList)(response.predictions);
    const predictions = validatedPredictions.filter((prediction) => prediction.confidence >= minimumConfidence);
    return {
        predictions,
        modelVersion: response.modelVersion,
        requestId: response.requestId,
        requiresUserConfirmation: true,
    };
}
