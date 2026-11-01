import mongoose from "mongoose";
import Outfit from "../../models/Outfit";
import OutfitHistory from "../../models/OutfitHistory";
import { createPaginationMeta, parsePagination } from "../../utils/pagination";
import type { LogOutfitWearInput } from "./outfits.types";

export class OutfitHistoryServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "OutfitHistoryServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new OutfitHistoryServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function logOutfitWear(
    userId: string,
    input: LogOutfitWearInput,
) {
    const userObjectId = toObjectId(userId);
    let outfitObjectId: mongoose.Types.ObjectId | undefined;
    let wardrobeItemObjectIds: mongoose.Types.ObjectId[] = [];
    let outfitName = input.outfitName || "";

    if (input.outfitId) {
        outfitObjectId = toObjectId(input.outfitId);
        const outfit = await Outfit.findOne({
            _id: outfitObjectId,
            userId: userObjectId,
        }).exec();

        if (!outfit) {
            throw new OutfitHistoryServiceError("Outfit not found or access denied.", 404);
        }

        outfitName = outfitName || outfit.name;
        wardrobeItemObjectIds = outfit.wardrobeItemIds.map((id) =>
            id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)),
        );

        // Update wornAt on the outfit document
        outfit.wornAt = input.wornAt || new Date();
        await outfit.save();
    } else if (input.wardrobeItemIds && input.wardrobeItemIds.length > 0) {
        wardrobeItemObjectIds = input.wardrobeItemIds.map((id) => toObjectId(id));
    }

    const historyRecord = new OutfitHistory({
        userId: userObjectId,
        outfitId: outfitObjectId,
        outfitName,
        wardrobeItemIds: wardrobeItemObjectIds,
        occasion: input.occasion || "casual",
        wornAt: input.wornAt || new Date(),
        notes: input.notes || "",
        rating: input.rating,
        feedback: input.feedback || "",
    });

    await historyRecord.save();
    return historyRecord.toObject();
}

export async function getOutfitHistory(
    userId: string,
    query: {
        page?: number | string;
        limit?: number | string;
        outfitId?: string;
        fromDate?: Date;
        toDate?: Date;
    } = {},
) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = parsePagination(query, 20, 100);

    const filter: Record<string, unknown> = {
        userId: userObjectId,
    };

    if (query.outfitId) {
        filter.outfitId = toObjectId(query.outfitId);
    }

    if (query.fromDate || query.toDate) {
        const dateFilter: Record<string, Date> = {};
        if (query.fromDate) dateFilter.$gte = new Date(query.fromDate);
        if (query.toDate) dateFilter.$lte = new Date(query.toDate);
        filter.wornAt = dateFilter;
    }

    const [items, total] = await Promise.all([
        OutfitHistory.find(filter)
            .sort({ wornAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        OutfitHistory.countDocuments(filter).exec(),
    ]);

    return {
        items,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function getRecentWornCombinations(
    userId: string,
    daysLimit = 14,
): Promise<string[][]> {
    const userObjectId = toObjectId(userId);
    const cutoffDate = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);

    const records = await OutfitHistory.find({
        userId: userObjectId,
        wornAt: { $gte: cutoffDate },
    })
        .select("wardrobeItemIds")
        .lean()
        .exec();

    return records.map((r) =>
        (r.wardrobeItemIds || []).map((id) => String(id)),
    );
}

export async function deleteOutfitHistory(
    userId: string,
    historyId: string,
): Promise<void> {
    const userObjectId = toObjectId(userId);
    const historyObjectId = toObjectId(historyId);

    const result = await OutfitHistory.findOneAndDelete({
        _id: historyObjectId,
        userId: userObjectId,
    }).exec();

    if (!result) {
        throw new OutfitHistoryServiceError("Outfit history record not found.", 404);
    }
}

