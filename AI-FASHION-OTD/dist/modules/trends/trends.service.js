"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrendServiceError = void 0;
exports.getTrends = getTrends;
exports.getTrendById = getTrendById;
exports.recordTrendInteraction = recordTrendInteraction;
exports.getPersonalizedTrends = getPersonalizedTrends;
const mongoose_1 = __importDefault(require("mongoose"));
const FashionTrend_1 = __importDefault(require("../../models/FashionTrend"));
const UserTrendInteraction_1 = __importDefault(require("../../models/UserTrendInteraction"));
const UserPreference_1 = __importDefault(require("../../models/UserPreference"));
const pagination_1 = require("../../utils/pagination");
class TrendServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "TrendServiceError";
    }
}
exports.TrendServiceError = TrendServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new TrendServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function getTrends(query = {}) {
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 20, 50);
    const filter = { isActive: true };
    if (query.category)
        filter.category = query.category;
    if (query.season)
        filter.season = query.season.toLowerCase();
    if (query.year)
        filter.year = query.year;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { description: { $regex: query.search, $options: "i" } },
            { tags: { $in: [new RegExp(query.search, "i")] } },
        ];
    }
    const [trends, total] = await Promise.all([
        FashionTrend_1.default.find(filter)
            .sort({ popularityScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        FashionTrend_1.default.countDocuments(filter).exec(),
    ]);
    return {
        trends,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function getTrendById(trendId) {
    const trendObjectId = toObjectId(trendId);
    const trend = await FashionTrend_1.default.findById(trendObjectId).lean().exec();
    if (!trend || !trend.isActive) {
        throw new TrendServiceError("Trend not found.", 404);
    }
    return trend;
}
async function recordTrendInteraction(userId, input) {
    const userObjectId = toObjectId(userId);
    const trendObjectId = toObjectId(input.trendId);
    const trend = await FashionTrend_1.default.findById(trendObjectId).exec();
    if (!trend) {
        throw new TrendServiceError("Trend not found.", 404);
    }
    const interaction = await UserTrendInteraction_1.default.create({
        userId: userObjectId,
        trendId: trendObjectId,
        interactionType: input.interactionType,
        interactedAt: new Date(),
    });
    // Update popularityScore if like or save
    if (input.interactionType === "like" || input.interactionType === "save") {
        trend.popularityScore = Math.min(100, trend.popularityScore + 1);
        await trend.save();
    }
    return interaction.toObject();
}
async function getPersonalizedTrends(userId) {
    const userObjectId = toObjectId(userId);
    const preferences = await UserPreference_1.default.findOne({ userId: userObjectId }).lean().exec();
    const preferredColors = preferences?.preferredColors || [];
    const preferredStyles = preferences?.preferredStyles || [];
    const query = { isActive: true };
    if (preferredColors.length > 0 || preferredStyles.length > 0) {
        query.$or = [
            { colors: { $in: preferredColors } },
            { tags: { $in: preferredStyles } },
        ];
    }
    const trends = await FashionTrend_1.default.find(query)
        .sort({ popularityScore: -1 })
        .limit(10)
        .lean()
        .exec();
    // If few personalized matches found, fallback to top trending
    if (trends.length < 5) {
        return FashionTrend_1.default.find({ isActive: true })
            .sort({ popularityScore: -1 })
            .limit(10)
            .lean()
            .exec();
    }
    return trends;
}
