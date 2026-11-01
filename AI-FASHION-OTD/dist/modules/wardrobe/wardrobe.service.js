"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WardrobeServiceError = void 0;
exports.createWardrobeItem = createWardrobeItem;
exports.getWardrobeItems = getWardrobeItems;
exports.getWardrobeItemById = getWardrobeItemById;
exports.updateWardrobeItem = updateWardrobeItem;
exports.deleteWardrobeItem = deleteWardrobeItem;
const mongoose_1 = __importStar(require("mongoose"));
const WardrobeItem_1 = require("../../models/WardrobeItem");
class WardrobeServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "WardrobeServiceError";
    }
}
exports.WardrobeServiceError = WardrobeServiceError;
function validateUserId(userId) {
    if (!mongoose_1.default.isValidObjectId(userId)) {
        throw new WardrobeServiceError("Invalid user ID.", 400);
    }
    return new mongoose_1.Types.ObjectId(userId);
}
function validateItemId(itemId) {
    if (!mongoose_1.default.isValidObjectId(itemId)) {
        throw new WardrobeServiceError("Invalid wardrobe item ID.", 400);
    }
    return new mongoose_1.Types.ObjectId(itemId);
}
function toWardrobeItemResponse(item) {
    return {
        id: String(item._id),
        userId: String(item.userId),
        name: item.name,
        category: item.category,
        color: item.color,
        style: item.style,
        season: item.season,
        ...(item.brand !== undefined ? { brand: item.brand } : {}),
        ...(item.notes !== undefined ? { notes: item.notes } : {}),
        ...(item.imageFileId !== undefined
            ? { imageFileId: String(item.imageFileId) }
            : {}),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };
}
async function createWardrobeItem(userId, input) {
    const ownerId = validateUserId(userId);
    const item = await WardrobeItem_1.WardrobeItem.create({
        ...input,
        userId: ownerId,
    });
    return toWardrobeItemResponse(item.toObject());
}
async function getWardrobeItems(userId, options = {}) {
    const ownerId = validateUserId(userId);
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));
    const filter = {
        userId: ownerId,
    };
    if (options.category)
        filter.category = options.category;
    if (options.style)
        filter.style = options.style;
    if (options.color) {
        filter.color = {
            $regex: options.color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
        };
    }
    if (options.season)
        filter.season = options.season;
    if (options.search) {
        const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { name: { $regex: escapedSearch, $options: "i" } },
            { brand: { $regex: escapedSearch, $options: "i" } },
            { notes: { $regex: escapedSearch, $options: "i" } },
        ];
    }
    const sortBy = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;
    const [items, totalItems] = await Promise.all([
        WardrobeItem_1.WardrobeItem.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),
        WardrobeItem_1.WardrobeItem.countDocuments(filter).exec(),
    ]);
    return {
        items: items.map((item) => toWardrobeItemResponse(item)),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}
async function getWardrobeItemById(userId, itemId) {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);
    const item = await WardrobeItem_1.WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    }).lean().exec();
    if (!item) {
        throw new WardrobeServiceError("Wardrobe item not found.", 404);
    }
    return toWardrobeItemResponse(item);
}
async function updateWardrobeItem(userId, itemId, input) {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);
    if (Object.keys(input).length === 0) {
        throw new WardrobeServiceError("Provide at least one field to update.", 400);
    }
    const item = await WardrobeItem_1.WardrobeItem.findOneAndUpdate({
        _id: wardrobeItemId,
        userId: ownerId,
    }, { $set: input }, {
        new: true,
        runValidators: true,
    }).lean().exec();
    if (!item) {
        throw new WardrobeServiceError("Wardrobe item not found.", 404);
    }
    return toWardrobeItemResponse(item);
}
async function deleteWardrobeItem(userId, itemId) {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);
    const deletedItem = await WardrobeItem_1.WardrobeItem.findOneAndDelete({
        _id: wardrobeItemId,
        userId: ownerId,
    }).exec();
    if (!deletedItem) {
        throw new WardrobeServiceError("Wardrobe item not found.", 404);
    }
}
