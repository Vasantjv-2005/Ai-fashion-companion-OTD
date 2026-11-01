"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankOutfits = rankOutfits;
/**
 * Sorts outfit recommendations by score, highest first.
 *
 * Scores should be between 0 and 1 when provided by the AI model.
 * Recommendations without a score are assigned a default score of 0.
 */
function rankOutfits(recommendations) {
    return [...recommendations].sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        return scoreB - scoreA;
    });
}
