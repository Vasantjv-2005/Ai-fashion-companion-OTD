
import type {
    OutfitRecommendation,
} from "../../integrations/ai/ai.types";

/**
 * Creates a consistent key for an outfit combination.
 * The order of item IDs does not affect whether outfits match.
 */
function createOutfitKey(itemIds: string[]): string {
    return [...itemIds].sort().join("|");
}

/**
 * Removes outfit combinations that appear in the user's history.
 *
 * previousOutfitItemSets should contain item IDs from the user's
 * previously worn or previously recommended outfits.
 */
export function removeRepeatedOutfits(
    recommendations: OutfitRecommendation[],
    previousOutfitItemSets: string[][],
): OutfitRecommendation[] {
    const previousOutfits = new Set(
        previousOutfitItemSets.map(createOutfitKey),
    );

    return recommendations.filter((outfit) => {
        if (!Array.isArray(outfit.itemIds) || outfit.itemIds.length === 0) {
            return false;
        }

        return !previousOutfits.has(createOutfitKey(outfit.itemIds));
    });
}
