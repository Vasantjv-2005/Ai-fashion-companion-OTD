import mongoose from "mongoose";
import WardrobeItem from "../../models/WardrobeItem";
import WardrobeGap from "../../models/WardrobeGap";
import WardrobeUsage from "../../models/WardrobeUsage";
import type { LogUsageDto, GapQueryDto } from "./wardrobe-intelligence.validator";
import type { WardrobeAnalytics, ItemUsageStatistics } from "./wardrobe-intelligence.types";

export class WardrobeIntelligenceServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "WardrobeIntelligenceServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new WardrobeIntelligenceServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function getWardrobeAnalytics(userId: string): Promise<WardrobeAnalytics> {
    const userObjectId = toObjectId(userId);

    const items = await WardrobeItem.find({ userId: userObjectId }).lean().exec();

    const categories: Record<string, number> = {};
    const styles: Record<string, number> = {};
    const colors: Record<string, number> = {};
    const seasons: Record<string, number> = {};

    for (const item of items) {
        categories[item.category] = (categories[item.category] || 0) + 1;
        styles[item.style] = (styles[item.style] || 0) + 1;
        colors[item.color.toLowerCase()] = (colors[item.color.toLowerCase()] || 0) + 1;

        for (const s of item.season) {
            seasons[s] = (seasons[s] || 0) + 1;
        }
    }

    // Item usage statistics
    const usageAgg = await WardrobeUsage.aggregate([
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

export async function analyzeWardrobeGaps(userId: string) {
    const userObjectId = toObjectId(userId);
    const items = await WardrobeItem.find({ userId: userObjectId }).lean().exec();

    const categories = new Set(items.map((i) => i.category.toLowerCase()));
    const colors = new Set(items.map((i) => i.color.toLowerCase()));
    const styles = new Set(items.map((i) => i.style.toLowerCase()));

    const identifiedGaps: Array<{
        category: string;
        title: string;
        description: string;
        reason: string;
        priority: "high" | "medium" | "low";
        suggestedColors: string[];
        suggestedStyles: string[];
        suggestedSeasons: string[];
        suggestedItemTypes: string[];
    }> = [];

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
        await WardrobeGap.findOneAndUpdate(
            {
                userId: userObjectId,
                category: gap.category,
                status: { $in: ["identified", "recommended"] },
            },
            {
                $set: {
                    userId: userObjectId,
                    ...gap,
                    lastAnalyzedAt: new Date(),
                },
            },
            { upsert: true, new: true },
        ).exec();
    }

    return getWardrobeGaps(userId);
}

export async function getWardrobeGaps(userId: string, query: GapQueryDto = {}) {
    const userObjectId = toObjectId(userId);
    const filter: Record<string, unknown> = { userId: userObjectId };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.category) filter.category = query.category.toLowerCase();

    return WardrobeGap.find(filter).sort({ priority: 1, createdAt: -1 }).lean().exec();
}

export async function updateGapStatus(userId: string, gapId: string, status: string) {
    const userObjectId = toObjectId(userId);
    const gapObjectId = toObjectId(gapId);

    const gap = await WardrobeGap.findOneAndUpdate(
        { _id: gapObjectId, userId: userObjectId },
        { $set: { status } },
        { new: true },
    )
        .lean()
        .exec();

    if (!gap) {
        throw new WardrobeIntelligenceServiceError("Wardrobe gap not found.", 404);
    }

    return gap;
}

export async function logWardrobeUsage(userId: string, input: LogUsageDto) {
    const userObjectId = toObjectId(userId);
    const itemObjectId = toObjectId(input.wardrobeItemId);

    // Verify item ownership
    const item = await WardrobeItem.findOne({
        _id: itemObjectId,
        userId: userObjectId,
    }).exec();

    if (!item) {
        throw new WardrobeIntelligenceServiceError("Wardrobe item not found or access denied.", 404);
    }

    const usage = await WardrobeUsage.create({
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

export async function getItemUsageStats(userId: string, itemId: string): Promise<ItemUsageStatistics> {
    const userObjectId = toObjectId(userId);
    const itemObjectId = toObjectId(itemId);

    const logs = await WardrobeUsage.find({
        userId: userObjectId,
        wardrobeItemId: itemObjectId,
    })
        .sort({ usedAt: 1 })
        .lean()
        .exec();

    const occasions: Record<string, number> = {};
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

