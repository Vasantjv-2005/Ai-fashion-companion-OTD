
import type {
    ClothingRecognitionResponse,
} from "../../../src/integrations/ai/ai.types";

/**
 * Sample AI clothing-recognition response for tests.
 * These are mock predictions, not real model results.
 */
export const clothingPredictionsFixture: ClothingRecognitionResponse = {
    predictions: [
        {
            category: "shirt",
            color: "blue",
            secondaryColor: "white",
            material: "cotton",
            pattern: "striped",
            style: ["casual", "smart-casual"],
            season: ["spring", "summer"],
            occasions: ["daily-wear", "college"],
            confidence: 0.94,
        },
        {
            category: "jeans",
            color: "dark blue",
            material: "denim",
            pattern: "solid",
            style: ["casual"],
            season: ["all-season"],
            occasions: ["daily-wear"],
            confidence: 0.89,
        },
        {
            category: "shoes",
            color: "white",
            material: "synthetic",
            style: ["casual", "sporty"],
            season: ["all-season"],
            occasions: ["daily-wear", "walking"],
            confidence: 0.42,
        },
    ],
    modelVersion: "mock-model-v1",
    requestId: "test-clothing-request-001",
};
