import mongoose from "mongoose";
import ShoppingRecommendation from "../../models/ShoppingRecommendation";
import WardrobeGap from "../../models/WardrobeGap";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type {
    CreateRecommendationDto,
    ShoppingQueryDto,
} from "./shopping.validator";

export class ShoppingServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "ShoppingServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new ShoppingServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function createRecommendation(
    userId: string,
    input: CreateRecommendationDto,
) {
    const userObjectId = toObjectId(userId);

    const relatedObjectIds = (input.relatedWardrobeItemIds || []).map((id) =>
        toObjectId(id),
    );

    const rec = await ShoppingRecommendation.create({
        ...input,
        userId: userObjectId,
        relatedWardrobeItemIds: relatedObjectIds,
        category: input.category.toLowerCase(),
    });

    return rec.toObject();
}

export async function getRecommendations(
    userId: string,
    query: Partial<ShoppingQueryDto> = {},
) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = parsePagination(query, 20, 50);

    const filter: Record<string, unknown> = { userId: userObjectId };

    if (query.category) filter.category = query.category.toLowerCase();
    if (query.status) filter.status = query.status;
    if (query.source) filter.source = query.source;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (query.minPrice !== undefined) priceFilter.$gte = query.minPrice;
        if (query.maxPrice !== undefined) priceFilter.$lte = query.maxPrice;
        filter.price = priceFilter;
    }

    const [items, total] = await Promise.all([
        ShoppingRecommendation.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        ShoppingRecommendation.countDocuments(filter).exec(),
    ]);

    return {
        items,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function updateRecommendationStatus(
    userId: string,
    id: string,
    status: "suggested" | "viewed" | "saved" | "purchased" | "dismissed",
) {
    const userObjectId = toObjectId(userId);
    const recObjectId = toObjectId(id);

    const rec = await ShoppingRecommendation.findOneAndUpdate(
        { _id: recObjectId, userId: userObjectId },
        { $set: { status } },
        { new: true },
    )
        .lean()
        .exec();

    if (!rec) {
        throw new ShoppingServiceError("Shopping recommendation not found.", 404);
    }

    return rec;
}

export async function generateGapShoppingList(userId: string) {
    const userObjectId = toObjectId(userId);

    // Find user's active gaps
    const gaps = await WardrobeGap.find({
        userId: userObjectId,
        status: { $in: ["identified", "recommended"] },
    })
        .lean()
        .exec();

    const createdRecs = [];

    for (const gap of gaps) {
        const itemType = gap.suggestedItemTypes?.[0] || gap.category;
        const color = gap.suggestedColors?.[0] || "neutral";

        const existing = await ShoppingRecommendation.findOne({
            userId: userObjectId,
            category: gap.category.toLowerCase(),
            status: { $in: ["suggested", "saved"] },
        }).exec();

        if (!existing) {
            const rec = await ShoppingRecommendation.create({
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

export async function deleteRecommendation(userId: string, id: string) {
    const userObjectId = toObjectId(userId);
    const recObjectId = toObjectId(id);

    const result = await ShoppingRecommendation.findOneAndDelete({
        _id: recObjectId,
        userId: userObjectId,
    }).exec();

    if (!result) {
        throw new ShoppingServiceError("Recommendation not found.", 404);
    }

    return { success: true, message: "Recommendation removed." };
}
