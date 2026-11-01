"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShoppingServiceError = void 0;
exports.createRecommendation = createRecommendation;
exports.getRecommendations = getRecommendations;
exports.updateRecommendationStatus = updateRecommendationStatus;
exports.generateGapShoppingList = generateGapShoppingList;
exports.deleteRecommendation = deleteRecommendation;
const mongoose_1 = __importDefault(require("mongoose"));
const ShoppingRecommendation_1 = __importDefault(require("../../models/ShoppingRecommendation"));
const WardrobeGap_1 = __importDefault(require("../../models/WardrobeGap"));
const pagination_1 = require("../../utils/pagination");
class ShoppingServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ShoppingServiceError";
    }
}
exports.ShoppingServiceError = ShoppingServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new ShoppingServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function createRecommendation(userId, input) {
    const userObjectId = toObjectId(userId);
    const relatedObjectIds = (input.relatedWardrobeItemIds || []).map((id) => toObjectId(id));
    const rec = await ShoppingRecommendation_1.default.create({
        ...input,
        userId: userObjectId,
        relatedWardrobeItemIds: relatedObjectIds,
        category: input.category.toLowerCase(),
    });
    return rec.toObject();
}
async function getRecommendations(userId, query = {}) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 20, 50);
    const filter = { userId: userObjectId };
    if (query.category)
        filter.category = query.category.toLowerCase();
    if (query.status)
        filter.status = query.status;
    if (query.source)
        filter.source = query.source;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        const priceFilter = {};
        if (query.minPrice !== undefined)
            priceFilter.$gte = query.minPrice;
        if (query.maxPrice !== undefined)
            priceFilter.$lte = query.maxPrice;
        filter.price = priceFilter;
    }
    const [items, total] = await Promise.all([
        ShoppingRecommendation_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        ShoppingRecommendation_1.default.countDocuments(filter).exec(),
    ]);
    return {
        items,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function updateRecommendationStatus(userId, id, status) {
    const userObjectId = toObjectId(userId);
    const recObjectId = toObjectId(id);
    const rec = await ShoppingRecommendation_1.default.findOneAndUpdate({ _id: recObjectId, userId: userObjectId }, { $set: { status } }, { new: true })
        .lean()
        .exec();
    if (!rec) {
        throw new ShoppingServiceError("Shopping recommendation not found.", 404);
    }
    return rec;
}
async function generateGapShoppingList(userId) {
    const userObjectId = toObjectId(userId);
    // Find user's active gaps
    const gaps = await WardrobeGap_1.default.find({
        userId: userObjectId,
        status: { $in: ["identified", "recommended"] },
    })
        .lean()
        .exec();
    const createdRecs = [];
    for (const gap of gaps) {
        const itemType = gap.suggestedItemTypes?.[0] || gap.category;
        const color = gap.suggestedColors?.[0] || "neutral";
        const existing = await ShoppingRecommendation_1.default.findOne({
            userId: userObjectId,
            category: gap.category.toLowerCase(),
            status: { $in: ["suggested", "saved"] },
        }).exec();
        if (!existing) {
            const rec = await ShoppingRecommendation_1.default.create({
                userId: userObjectId,
                productName: `Essential ${color} ${itemType}`,
                description: `Fills your wardrobe gap: ${gap.title}. ${gap.description}`,
                category: gap.category.toLowerCase(),
                color,
                style: gap.suggestedStyles?.[0] || "casual",
                season: gap.suggestedSeasons?.[0] || "all-season",
                productUrl: `https://shopping.example.com/search?q=${encodeURIComponent(`${color} ${itemType}`)}`,
                source: "wardrobe_gap",
                status: "suggested",
                recommendationReason: gap.reason,
            });
            createdRecs.push(rec.toObject());
        }
    }
    return createdRecs;
}
async function deleteRecommendation(userId, id) {
    const userObjectId = toObjectId(userId);
    const recObjectId = toObjectId(id);
    const result = await ShoppingRecommendation_1.default.findOneAndDelete({
        _id: recObjectId,
        userId: userObjectId,
    }).exec();
    if (!result) {
        throw new ShoppingServiceError("Recommendation not found.", 404);
    }
    return { success: true, message: "Recommendation removed." };
}
