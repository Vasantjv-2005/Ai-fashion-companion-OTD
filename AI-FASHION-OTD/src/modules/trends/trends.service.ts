import mongoose from "mongoose";
import FashionTrend from "../../models/FashionTrend";
import UserTrendInteraction from "../../models/UserTrendInteraction";
import UserPreference from "../../models/UserPreference";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type { TrendQueryDto, InteractTrendDto } from "./trends.validator";

export class TrendServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "TrendServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new TrendServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function getTrends(query: Partial<TrendQueryDto> = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 50);

    const filter: Record<string, unknown> = { isActive: true };

    if (query.category) filter.category = query.category;
    if (query.season) filter.season = query.season.toLowerCase();
    if (query.year) filter.year = query.year;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { description: { $regex: query.search, $options: "i" } },
            { tags: { $in: [new RegExp(query.search, "i")] } },
        ];
    }

    const [trends, total] = await Promise.all([
        FashionTrend.find(filter)
            .sort({ popularityScore: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        FashionTrend.countDocuments(filter).exec(),
    ]);

    return {
        trends,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function getTrendById(trendId: string) {
    const trendObjectId = toObjectId(trendId);

    const trend = await FashionTrend.findById(trendObjectId).lean().exec();
    if (!trend || !trend.isActive) {
        throw new TrendServiceError("Trend not found.", 404);
    }

    return trend;
}

export async function recordTrendInteraction(
    userId: string,
    input: InteractTrendDto,
) {
    const userObjectId = toObjectId(userId);
    const trendObjectId = toObjectId(input.trendId);

    const trend = await FashionTrend.findById(trendObjectId).exec();
    if (!trend) {
        throw new TrendServiceError("Trend not found.", 404);
    }

    const interaction = await UserTrendInteraction.create({
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

export async function getPersonalizedTrends(userId: string) {
    const userObjectId = toObjectId(userId);

    const preferences = await UserPreference.findOne({ userId: userObjectId }).lean().exec();

    const preferredColors = preferences?.preferredColors || [];
    const preferredStyles = preferences?.preferredStyles || [];

    const query: Record<string, unknown> = { isActive: true };

    if (preferredColors.length > 0 || preferredStyles.length > 0) {
        query.$or = [
            { colors: { $in: preferredColors } },
            { tags: { $in: preferredStyles } },
        ];
    }

    const trends = await FashionTrend.find(query)
        .sort({ popularityScore: -1 })
        .limit(10)
        .lean()
        .exec();

    // If few personalized matches found, fallback to top trending
    if (trends.length < 5) {
        return FashionTrend.find({ isActive: true })
            .sort({ popularityScore: -1 })
            .limit(10)
            .lean()
            .exec();
    }

    return trends;
}
