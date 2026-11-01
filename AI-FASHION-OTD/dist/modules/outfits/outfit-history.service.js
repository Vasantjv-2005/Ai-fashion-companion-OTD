"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutfitHistoryServiceError = void 0;
exports.logOutfitWear = logOutfitWear;
exports.getOutfitHistory = getOutfitHistory;
exports.getRecentWornCombinations = getRecentWornCombinations;
exports.deleteOutfitHistory = deleteOutfitHistory;
const mongoose_1 = __importDefault(require("mongoose"));
const Outfit_1 = __importDefault(require("../../models/Outfit"));
const OutfitHistory_1 = __importDefault(require("../../models/OutfitHistory"));
const pagination_1 = require("../../utils/pagination");
class OutfitHistoryServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "OutfitHistoryServiceError";
    }
}
exports.OutfitHistoryServiceError = OutfitHistoryServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new OutfitHistoryServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function logOutfitWear(userId, input) {
    const userObjectId = toObjectId(userId);
    let outfitObjectId;
    let wardrobeItemObjectIds = [];
    let outfitName = input.outfitName || "";
    if (input.outfitId) {
        outfitObjectId = toObjectId(input.outfitId);
        const outfit = await Outfit_1.default.findOne({
            _id: outfitObjectId,
            userId: userObjectId,
        }).exec();
        if (!outfit) {
            throw new OutfitHistoryServiceError("Outfit not found or access denied.", 404);
        }
        outfitName = outfitName || outfit.name;
        wardrobeItemObjectIds = outfit.wardrobeItemIds.map((id) => id instanceof mongoose_1.default.Types.ObjectId ? id : new mongoose_1.default.Types.ObjectId(String(id)));
        // Update wornAt on the outfit document
        outfit.wornAt = input.wornAt || new Date();
        await outfit.save();
    }
    else if (input.wardrobeItemIds && input.wardrobeItemIds.length > 0) {
        wardrobeItemObjectIds = input.wardrobeItemIds.map((id) => toObjectId(id));
    }
    const historyRecord = new OutfitHistory_1.default({
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
async function getOutfitHistory(userId, query = {}) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 20, 100);
    const filter = {
        userId: userObjectId,
    };
    if (query.outfitId) {
        filter.outfitId = toObjectId(query.outfitId);
    }
    if (query.fromDate || query.toDate) {
        const dateFilter = {};
        if (query.fromDate)
            dateFilter.$gte = new Date(query.fromDate);
        if (query.toDate)
            dateFilter.$lte = new Date(query.toDate);
        filter.wornAt = dateFilter;
    }
    const [items, total] = await Promise.all([
        OutfitHistory_1.default.find(filter)
            .sort({ wornAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
            .exec(),
        OutfitHistory_1.default.countDocuments(filter).exec(),
    ]);
    return {
        items,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function getRecentWornCombinations(userId, daysLimit = 14) {
    const userObjectId = toObjectId(userId);
    const cutoffDate = new Date(Date.now() - daysLimit * 24 * 60 * 60 * 1000);
    const records = await OutfitHistory_1.default.find({
        userId: userObjectId,
        wornAt: { $gte: cutoffDate },
    })
        .select("wardrobeItemIds")
        .lean()
        .exec();
    return records.map((r) => (r.wardrobeItemIds || []).map((id) => String(id)));
}
async function deleteOutfitHistory(userId, historyId) {
    const userObjectId = toObjectId(userId);
    const historyObjectId = toObjectId(historyId);
    const result = await OutfitHistory_1.default.findOneAndDelete({
        _id: historyObjectId,
        userId: userObjectId,
    }).exec();
    if (!result) {
        throw new OutfitHistoryServiceError("Outfit history record not found.", 404);
    }
}
