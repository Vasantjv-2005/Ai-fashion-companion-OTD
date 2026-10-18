
import { describe, expect, it } from "vitest";

import type {
    OutfitRecommendation,
} from "../../src/integrations/ai/ai.types";

import {
    validateRecommendations,
} from "../../src/modules/outfits/outfit-validation.service";

import {
    rankOutfits,
} from "../../src/modules/outfits/outfit-ranking.service";

import {
    removeRepeatedOutfits,
} from "../../src/modules/outfits/outfit-repetition.service";

import {
    outfitRecommendationsFixture,
} from "../fixtures/ai/outfit-recommendations.fixture";

const recommendations: OutfitRecommendation[] =
    outfitRecommendationsFixture.recommendations;

describe("Outfit recommendation services", () => {
    it("rejects outfits containing items the user does not own", () => {
        const result = validateRecommendations(recommendations, {
            ownedItemIds: [
                "shirt-001",
                "jeans-001",
                "sneakers-001",
            ],
        });

        expect(result).toHaveLength(1);
        expect(result[0].itemIds).toEqual([
            "shirt-001",
            "jeans-001",
            "sneakers-001",
        ]);
    });

    it("rejects outfits containing excluded items", () => {
        const result = validateRecommendations(recommendations, {
            ownedItemIds: [
                "shirt-001",
                "jeans-001",
                "sneakers-001",
            ],
            excludedItemIds: ["sneakers-001"],
        });

        expect(result).toHaveLength(0);
    });

    it("ranks outfits from highest to lowest score", () => {
        const result = rankOutfits(recommendations);

        expect(result[0].score).toBe(0.94);
        expect(result[1].score).toBe(0.88);
        expect(result[2].score).toBe(0.82);
    });

    it("removes previously worn outfit combinations", () => {
        const result = removeRepeatedOutfits(
            recommendations,
            [["sneakers-001", "shirt-001", "jeans-001"]],
        );

        expect(result).toHaveLength(2);
        expect(
            result.some((outfit) =>
                outfit.itemIds.includes("shirt-001"),
            ),
        ).toBe(false);
    });

    it("rejects outfits containing duplicate item IDs", () => {
        const duplicateOutfit: OutfitRecommendation[] = [
            {
                itemIds: ["shirt-001", "shirt-001"],
                explanation: "Invalid duplicate outfit",
                score: 0.99,
            },
        ];

        const result = validateRecommendations(duplicateOutfit, {
            ownedItemIds: ["shirt-001"],
        });

        expect(result).toHaveLength(0);
    });
});
