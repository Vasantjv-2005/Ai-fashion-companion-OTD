"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutfitGenerationServiceError = void 0;
exports.generateOutfitRecommendations = generateOutfitRecommendations;
const mongoose_1 = __importDefault(require("mongoose"));
const OutfitGeneration_1 = __importDefault(require("../../models/OutfitGeneration"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
const outfit_history_service_1 = require("./outfit-history.service");
const outfit_ranking_service_1 = require("./outfit-ranking.service");
const outfit_repetition_service_1 = require("./outfit-repetition.service");
const outfit_validation_service_1 = require("./outfit-validation.service");
class OutfitGenerationServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "OutfitGenerationServiceError";
    }
}
exports.OutfitGenerationServiceError = OutfitGenerationServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new OutfitGenerationServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function generateOutfitRecommendations(userId, request = {}) {
    const userObjectId = toObjectId(userId);
    const startTime = Date.now();
    // 1. Fetch user's active wardrobe items
    const items = await WardrobeItem_1.default.find({ userId: userObjectId }).lean().exec();
    if (items.length === 0) {
        throw new OutfitGenerationServiceError("Your wardrobe is empty. Add clothing items before generating outfits.", 400);
    }
    const ownedItemIds = items.map((i) => String(i._id));
    const excludedSet = new Set(request.excludedItemIds || []);
    const eligibleItems = items.filter((i) => !excludedSet.has(String(i._id)));
    // Group items by category
    const tops = eligibleItems.filter((i) => i.category === "tops");
    const bottoms = eligibleItems.filter((i) => i.category === "bottoms");
    const dresses = eligibleItems.filter((i) => i.category === "dresses");
    const shoes = eligibleItems.filter((i) => i.category === "shoes");
    const outerwear = eligibleItems.filter((i) => i.category === "outerwear");
    const accessories = eligibleItems.filter((i) => i.category === "accessories");
    const candidateRecommendations = [];
    // Combinations: Top + Bottom + Shoes
    for (const top of tops) {
        for (const bottom of bottoms) {
            const outfitItems = [String(top._id), String(bottom._id)];
            if (shoes.length > 0) {
                outfitItems.push(String(shoes[0]._id));
            }
            if (outerwear.length > 0 && request.season && ["winter", "autumn"].includes(request.season.toLowerCase())) {
                outfitItems.push(String(outerwear[0]._id));
            }
            if (request.includeAccessories && accessories.length > 0) {
                outfitItems.push(String(accessories[0]._id));
            }
            // Score based on style match and season compatibility
            let score = 0.75;
            if (request.requestedStyle && top.style.toLowerCase() === request.requestedStyle.toLowerCase()) {
                score += 0.1;
            }
            if (top.color.toLowerCase() === bottom.color.toLowerCase()) {
                score -= 0.05; // avoid monochromatic mismatch unless intentional
            }
            else {
                score += 0.05;
            }
            candidateRecommendations.push({
                itemIds: outfitItems,
                score: Math.min(0.99, Math.max(0.1, Math.round(score * 100) / 100)),
                explanation: `Complementary ${top.name} with ${bottom.name}${shoes.length > 0 ? ` and ${shoes[0].name}` : ""}.`,
            });
        }
    }
    // Combinations: Dress + Shoes
    for (const dress of dresses) {
        const outfitItems = [String(dress._id)];
        if (shoes.length > 0) {
            outfitItems.push(String(shoes[0]._id));
        }
        if (outerwear.length > 0 && request.season && ["winter", "autumn"].includes(request.season.toLowerCase())) {
            outfitItems.push(String(outerwear[0]._id));
        }
        let score = 0.8;
        if (request.requestedStyle && dress.style.toLowerCase() === request.requestedStyle.toLowerCase()) {
            score += 0.1;
        }
        candidateRecommendations.push({
            itemIds: outfitItems,
            score: Math.min(0.99, Math.max(0.1, Math.round(score * 100) / 100)),
            explanation: `Effortless look featuring ${dress.name}${shoes.length > 0 ? ` paired with ${shoes[0].name}` : ""}.`,
        });
    }
    // 2. Validate items belong to user and have no duplicates
    const validated = (0, outfit_validation_service_1.validateRecommendations)(candidateRecommendations, {
        ownedItemIds,
        excludedItemIds: request.excludedItemIds,
        minimumItems: 1,
    });
    // 3. Remove recently worn combinations
    const recentCombinations = await (0, outfit_history_service_1.getRecentWornCombinations)(userId, 14);
    const nonRepeated = (0, outfit_repetition_service_1.removeRepeatedOutfits)(validated, recentCombinations);
    // 4. Rank highest score first
    const ranked = (0, outfit_ranking_service_1.rankOutfits)(nonRepeated.length > 0 ? nonRepeated : validated);
    const topRecommendations = ranked.slice(0, 10);
    const processingTimeMs = Date.now() - startTime;
    // 5. Record generation record in database
    await OutfitGeneration_1.default.create({
        userId: userObjectId,
        occasion: request.occasion || "casual",
        requestedStyle: request.requestedStyle || "casual",
        season: request.season || "all-season",
        wardrobeItemIds: eligibleItems.map((i) => i._id),
        generatedOutfits: topRecommendations.map((rec) => ({
            name: `${request.occasion || "Daily"} Outfit`,
            description: rec.explanation,
            wardrobeItemIds: rec.itemIds.map((id) => toObjectId(id)),
            style: request.requestedStyle || "casual",
            explanation: rec.explanation,
            score: Math.round((rec.score || 0.8) * 100),
        })),
        status: "completed",
        aiProvider: process.env.AI_SERVICE_URL ? "external-ai" : "rule-engine",
        generatedAt: new Date(),
        processingTimeMs,
    });
    return {
        recommendations: topRecommendations,
        total: topRecommendations.length,
        processingTimeMs,
    };
}
