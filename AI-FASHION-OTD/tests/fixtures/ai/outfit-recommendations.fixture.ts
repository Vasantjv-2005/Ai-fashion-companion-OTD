
import type {
    OutfitRecommendationResponse,
} from "../../../src/integrations/ai/ai.types";

/**
 * Mock outfit recommendations for automated tests.
 * Item IDs must match the sample IDs used in the tests.
 */
export const outfitRecommendationsFixture: OutfitRecommendationResponse = {
    recommendations: [
        {
            itemIds: ["shirt-001", "jeans-001", "sneakers-001"],
            explanation:
                "A casual everyday outfit suitable for college or meeting friends.",
            score: 0.94,
        },
        {
            itemIds: ["shirt-002", "trousers-001", "loafers-001"],
            explanation:
                "A smart-casual outfit suitable for a presentation or dinner.",
            score: 0.88,
        },
        {
            itemIds: ["hoodie-001", "jeans-002", "sneakers-002"],
            explanation:
                "A relaxed outfit suitable for a casual outing.",
            score: 0.82,
        },
    ],
    modelVersion: "mock-outfit-model-v1",
    requestId: "test-outfit-request-001",
};
