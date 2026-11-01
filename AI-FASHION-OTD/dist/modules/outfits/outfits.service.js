"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutfitServiceError = void 0;
exports.createOutfit = createOutfit;
exports.getOutfits = getOutfits;
exports.getOutfitById = getOutfitById;
exports.updateOutfit = updateOutfit;
exports.deleteOutfit = deleteOutfit;
const mongoose_1 = __importDefault(require("mongoose"));
const Outfit_1 = __importDefault(require("../../models/Outfit"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
class OutfitServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "OutfitServiceError";
    }
}
exports.OutfitServiceError = OutfitServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new OutfitServiceError("Invalid ID.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
/**
 * Verify that all clothing items exist and belong to the user.
 */
async function verifyWardrobeItems(userId, clothingItemIds) {
    const itemIds = clothingItemIds.map((id) => toObjectId(id));
    const uniqueIds = new Set(itemIds.map((id) => id.toString()));
    if (uniqueIds.size !== itemIds.length) {
        throw new OutfitServiceError("Duplicate clothing item IDs are not allowed.", 400);
    }
    const items = await WardrobeItem_1.default.find({
        _id: { $in: itemIds },
        userId,
    })
        .select("_id")
        .lean()
        .exec();
    if (items.length !== itemIds.length) {
        throw new OutfitServiceError("One or more clothing items were not found in your wardrobe.", 400);
    }
    return itemIds;
}
/**
 * Create an outfit.
 */
async function createOutfit(userId, input) {
    const userObjectId = toObjectId(userId);
    const clothingItemIds = await verifyWardrobeItems(userObjectId, input.clothingItemIds);
    const outfit = new Outfit_1.default({
        ...input,
        userId: userObjectId,
        clothingItemIds,
    });
    await outfit.save();
    return outfit.toObject();
}
/**
 * Get all outfits belonging to the user.
 */
async function getOutfits(userId, options = {}) {
    const userObjectId = toObjectId(userId);
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 10)));
    const filter = {
        userId: userObjectId,
    };
    if (options.occasion) {
        filter.occasion = options.occasion;
    }
    if (options.status) {
        filter.status = options.status;
    }
    const [outfits, total] = await Promise.all([
        Outfit_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),
        Outfit_1.default.countDocuments(filter).exec(),
    ]);
    return {
        outfits,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
/**
 * Get one outfit belonging to the user.
 */
async function getOutfitById(userId, outfitId) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);
    const outfit = await Outfit_1.default.findOne({
        _id: outfitObjectId,
        userId: userObjectId,
    })
        .lean()
        .exec();
    if (!outfit) {
        throw new OutfitServiceError("Outfit not found.", 404);
    }
    return outfit;
}
/**
 * Update an outfit belonging to the user.
 */
async function updateOutfit(userId, outfitId, input) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);
    const existingOutfit = await Outfit_1.default.findOne({
        _id: outfitObjectId,
        userId: userObjectId,
    })
        .select("_id")
        .lean()
        .exec();
    if (!existingOutfit) {
        throw new OutfitServiceError("Outfit not found.", 404);
    }
    const updateData = { ...input };
    if (input.clothingItemIds !== undefined) {
        updateData.clothingItemIds = await verifyWardrobeItems(userObjectId, input.clothingItemIds);
    }
    const updatedOutfit = await Outfit_1.default.findOneAndUpdate({
        _id: outfitObjectId,
        userId: userObjectId,
    }, {
        $set: updateData,
    }, {
        new: true,
        runValidators: true,
    })
        .lean()
        .exec();
    if (!updatedOutfit) {
        throw new OutfitServiceError("Outfit not found.", 404);
    }
    return updatedOutfit;
}
/**
 * Delete an outfit belonging to the user.
 */
async function deleteOutfit(userId, outfitId) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);
    const deletedOutfit = await Outfit_1.default.findOneAndDelete({
        _id: outfitObjectId,
        userId: userObjectId,
    })
        .lean()
        .exec();
    if (!deletedOutfit) {
        throw new OutfitServiceError("Outfit not found.", 404);
    }
    return {
        message: "Outfit deleted successfully.",
        outfitId: outfitId,
    };
}
