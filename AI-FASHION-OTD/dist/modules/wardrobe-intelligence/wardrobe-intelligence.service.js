"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardrobeIntelligenceServiceError = void 0;
exports.getWardrobeAnalytics = getWardrobeAnalytics;
exports.analyzeWardrobeGaps = analyzeWardrobeGaps;
exports.getWardrobeGaps = getWardrobeGaps;
exports.updateGapStatus = updateGapStatus;
exports.logWardrobeUsage = logWardrobeUsage;
exports.getItemUsageStats = getItemUsageStats;
const mongoose_1 = __importDefault(require("mongoose"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
const WardrobeGap_1 = __importDefault(require("../../models/WardrobeGap"));
const WardrobeUsage_1 = __importDefault(require("../../models/WardrobeUsage"));
class WardrobeIntelligenceServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "WardrobeIntelligenceServiceError";
    }
}
exports.WardrobeIntelligenceServiceError = WardrobeIntelligenceServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new WardrobeIntelligenceServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function getWardrobeAnalytics(userId) {
    const userObjectId = toObjectId(userId);
    const items = await WardrobeItem_1.default.find({ userId: userObjectId }).lean().exec();
    const categories = {};
    const styles = {};
    const colors = {};
    const seasons = {};
    for (const item of items) {
        categories[item.category] = (categories[item.category] || 0) + 1;
        styles[item.style] = (styles[item.style] || 0) + 1;
        colors[item.color.toLowerCase()] = (colors[item.color.toLowerCase()] || 0) + 1;
        for (const s of item.season) {
            seasons[s] = (seasons[s] || 0) + 1;
        }
    }
    // Item usage statistics
    const usageAgg = await WardrobeUsage_1.default.aggregate([
        { $match: { userId: userObjectId } },
        {
            $group: {
                _id: "$wardrobeItemId",
                totalWears: { $sum: 1 },
                lastWorn: { $max: "$usedAt" },
            },
        },
        { $sort: { totalWears: -1 } },
        { $limit: 10 },
    ]).exec();
    const itemMap = new Map(items.map((i) => [String(i._id), i.name]));
    const mostWornItems = usageAgg.map((u) => ({
        itemId: String(u._id),
        name: itemMap.get(String(u._id)) || "Unknown item",
        wearCount: u.totalWears,
        lastWorn: u.lastWorn,
    }));
    // Find unworn items
    const wornItemIds = new Set(usageAgg.map((u) => String(u._id)));
    const unwornItems = items
        .filter((i) => !wornItemIds.has(String(i._id)))
        .map((i) => ({
        itemId: String(i._id),
        name: i.name,
        category: i.category,
        createdAt: i.createdAt,
    }));
    return {
        totalItems: items.length,
        categories,
        styles,
        colors,
        seasons,
        neglectedItemsCount: unwornItems.length,
        mostWornItems,
        unwornItems,
    };
}
async function analyzeWardrobeGaps(userId) {
    const userObjectId = toObjectId(userId);
    const items = await WardrobeItem_1.default.find({ userId: userObjectId }).lean().exec();
    const categories = new Set(items.map((i) => i.category.toLowerCase()));
    const colors = new Set(items.map((i) => i.color.toLowerCase()));
    const styles = new Set(items.map((i) => i.style.toLowerCase()));
    const identifiedGaps = [];
    // 1. Check for missing essentials
    if (!categories.has("tops")) {
        identifiedGaps.push({
            category: "tops",
            title: "Missing Tops & Shirts",
            description: "Your wardrobe lacks basic tops, which are essential building blocks for outfits.",
            reason: "Essential clothing category missing",
            priority: "high",
            suggestedColors: ["white", "black", "navy"],
            suggestedStyles: ["casual", "minimalist"],
            suggestedSeasons: ["all-season"],
            suggestedItemTypes: ["t-shirt", "button-down shirt"],
        });
    }
    if (!categories.has("bottoms")) {
        identifiedGaps.push({
            category: "bottoms",
            title: "Missing Bottoms & Trousers",
            description: "No pants, jeans, or shorts found in your wardrobe.",
            reason: "Essential clothing category missing",
            priority: "high",
            suggestedColors: ["blue", "black", "grey"],
            suggestedStyles: ["casual"],
            suggestedSeasons: ["all-season"],
            suggestedItemTypes: ["jeans", "chinos"],
        });
    }
    if (!categories.has("shoes")) {
        identifiedGaps.push({
            category: "shoes",
            title: "Missing Footwear",
            description: "Complete your looks by adding everyday footwear.",
            reason: "Footwear is required to generate complete outfits",
            priority: "high",
            suggestedColors: ["white", "black", "brown"],
            suggestedStyles: ["casual", "minimalist"],
            suggestedSeasons: ["all-season"],
            suggestedItemTypes: ["sneakers", "loafers"],
        });
    }
    if (!categories.has("outerwear") && items.length >= 5) {
        identifiedGaps.push({
            category: "outerwear",
            title: "Missing Layering Pieces",
            description: "Adding a jacket or cardigan allows layering across changing seasons and formal events.",
            reason: "Layering enhances versatility",
            priority: "medium",
            suggestedColors: ["navy", "black", "olive"],
            suggestedStyles: ["smart-casual", "casual"],
            suggestedSeasons: ["autumn", "winter"],
            suggestedItemTypes: ["denim jacket", "blazer", "cardigan"],
        });
    }
    // 2. Check for missing formal options if user has enough items
    if (items.length >= 6 && !styles.has("formal") && !styles.has("smart-casual")) {
        identifiedGaps.push({
            category: "formal",
            title: "Missing Smart & Formal Attire",
            description: "Your wardrobe is primarily casual. A smart-casual shirt or blazer will prepare you for meetings and events.",
            reason: "Event readiness gap",
            priority: "medium",
            suggestedColors: ["navy", "white", "charcoal"],
            suggestedStyles: ["smart-casual", "formal"],
            suggestedSeasons: ["all-season"],
            suggestedItemTypes: ["oxford shirt", "blazer"],
        });
    }
    // 3. Check for neutral palette foundation
    const hasNeutral = colors.has("white") || colors.has("black") || colors.has("grey") || colors.has("navy");
    if (!hasNeutral && items.length >= 4) {
        identifiedGaps.push({
            category: "neutrals",
            title: "Missing Neutral Basics",
            description: "Neutral tones make mixing and matching items much easier.",
            reason: "Color coordination foundation",
            priority: "medium",
            suggestedColors: ["white", "black", "grey"],
            suggestedStyles: ["minimalist"],
            suggestedSeasons: ["all-season"],
            suggestedItemTypes: ["basic t-shirt", "neutral trousers"],
        });
    }
    // Upsert into WardrobeGap collection
    for (const gap of identifiedGaps) {
        await WardrobeGap_1.default.findOneAndUpdate({
            userId: userObjectId,
            category: gap.category,
            status: { $in: ["identified", "recommended"] },
        }, {
            $set: {
                userId: userObjectId,
                ...gap,
                lastAnalyzedAt: new Date(),
            },
        }, { upsert: true, new: true }).exec();
    }
    return getWardrobeGaps(userId);
}
async function getWardrobeGaps(userId, query = {}) {
    const userObjectId = toObjectId(userId);
    const filter = { userId: userObjectId };
    if (query.status)
        filter.status = query.status;
    if (query.priority)
        filter.priority = query.priority;
    if (query.category)
        filter.category = query.category.toLowerCase();
    return WardrobeGap_1.default.find(filter).sort({ priority: 1, createdAt: -1 }).lean().exec();
}
async function updateGapStatus(userId, gapId, status) {
    const userObjectId = toObjectId(userId);
    const gapObjectId = toObjectId(gapId);
    const gap = await WardrobeGap_1.default.findOneAndUpdate({ _id: gapObjectId, userId: userObjectId }, { $set: { status } }, { new: true })
        .lean()
        .exec();
    if (!gap) {
        throw new WardrobeIntelligenceServiceError("Wardrobe gap not found.", 404);
    }
    return gap;
}
async function logWardrobeUsage(userId, input) {
    const userObjectId = toObjectId(userId);
    const itemObjectId = toObjectId(input.wardrobeItemId);
    // Verify item ownership
    const item = await WardrobeItem_1.default.findOne({
        _id: itemObjectId,
        userId: userObjectId,
    }).exec();
    if (!item) {
        throw new WardrobeIntelligenceServiceError("Wardrobe item not found or access denied.", 404);
    }
    const usage = await WardrobeUsage_1.default.create({
        userId: userObjectId,
        wardrobeItemId: itemObjectId,
        outfitId: input.outfitId ? toObjectId(input.outfitId) : undefined,
        eventId: input.eventId ? toObjectId(input.eventId) : undefined,
        occasion: input.occasion,
        usedAt: input.usedAt || new Date(),
        notes: input.notes,
    });
    return usage.toObject();
}
async function getItemUsageStats(userId, itemId) {
    const userObjectId = toObjectId(userId);
    const itemObjectId = toObjectId(itemId);
    const logs = await WardrobeUsage_1.default.find({
        userId: userObjectId,
        wardrobeItemId: itemObjectId,
    })
        .sort({ usedAt: 1 })
        .lean()
        .exec();
    const occasions = {};
    for (const log of logs) {
        occasions[log.occasion] = (occasions[log.occasion] || 0) + 1;
    }
    return {
        itemId,
        totalWears: logs.length,
        occasions,
        firstWorn: logs.length > 0 ? logs[0].usedAt : undefined,
        lastWorn: logs.length > 0 ? logs[logs.length - 1].usedAt : undefined,
    };
}
