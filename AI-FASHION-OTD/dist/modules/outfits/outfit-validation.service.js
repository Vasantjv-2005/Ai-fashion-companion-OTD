"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRecommendations = validateRecommendations;
function validateRecommendations(recommendations, options) {
    const { ownedItemIds, excludedItemIds = [], minimumItems = 1, } = options;
    const ownedItems = new Set(ownedItemIds);
    const excludedItems = new Set(excludedItemIds);
    if (!Number.isInteger(minimumItems) ||
        minimumItems < 1) {
        throw new Error("minimumItems must be a positive integer.");
    }
    return recommendations.filter((outfit) => {
        if (!Array.isArray(outfit.itemIds) ||
            outfit.itemIds.length < minimumItems) {
            return false;
        }
        // An outfit must not repeat the same wardrobe item.
        if (new Set(outfit.itemIds).size !== outfit.itemIds.length) {
            return false;
        }
        // Every item must belong to the user's wardrobe.
        if (!outfit.itemIds.every((id) => ownedItems.has(id))) {
            return false;
        }
        // Respect items the user has explicitly excluded.
        if (outfit.itemIds.some((id) => excludedItems.has(id))) {
            return false;
        }
        return true;
    });
}
