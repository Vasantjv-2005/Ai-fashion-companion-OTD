"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRepeatedOutfits = removeRepeatedOutfits;
/**
 * Creates a consistent key for an outfit combination.
 * The order of item IDs does not affect whether outfits match.
 */
function createOutfitKey(itemIds) {
    return [...itemIds].sort().join("|");
}
/**
 * Removes outfit combinations that appear in the user's history.
 *
 * previousOutfitItemSets should contain item IDs from the user's
 * previously worn or previously recommended outfits.
 */
function removeRepeatedOutfits(recommendations, previousOutfitItemSets) {
    const previousOutfits = new Set(previousOutfitItemSets.map(createOutfitKey));
    return recommendations.filter((outfit) => {
        if (!Array.isArray(outfit.itemIds) || outfit.itemIds.length === 0) {
            return false;
        }
        return !previousOutfits.has(createOutfitKey(outfit.itemIds));
    });
}
