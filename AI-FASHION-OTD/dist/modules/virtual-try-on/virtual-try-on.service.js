"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualTryOnServiceError = void 0;
exports.createTryOnSession = createTryOnSession;
exports.getTryOnSession = getTryOnSession;
exports.getUserTryOns = getUserTryOns;
exports.deleteTryOnSession = deleteTryOnSession;
const mongoose_1 = __importDefault(require("mongoose"));
const VirtualTryOn_1 = __importDefault(require("../../models/VirtualTryOn"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
const Avatar_1 = __importDefault(require("../../models/Avatar"));
const gridfs_service_1 = require("../../integrations/storage/gridfs.service");
const file_validation_1 = require("../../utils/file-validation");
const pagination_1 = require("../../utils/pagination");
class VirtualTryOnServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "VirtualTryOnServiceError";
    }
}
exports.VirtualTryOnServiceError = VirtualTryOnServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new VirtualTryOnServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function createTryOnSession(userId, input, uploadedFile) {
    const userObjectId = toObjectId(userId);
    // 1. Resolve user model image
    let resolvedImageUrl = input.userImageUrl;
    if (uploadedFile) {
        const fileCheck = (0, file_validation_1.validateImageFile)(uploadedFile);
        if (!fileCheck.isValid) {
            throw new VirtualTryOnServiceError(fileCheck.error || "Invalid user image file.", 400);
        }
        const saved = await (0, gridfs_service_1.saveImage)({
            filename: `tryon-user-${userId}-${Date.now()}`,
            contentType: uploadedFile.mimetype,
            buffer: uploadedFile.buffer,
        });
        resolvedImageUrl = `/api/wardrobe/images/${saved.fileId}`;
    }
    if (!resolvedImageUrl) {
        // Fallback: check user's avatar
        const userAvatar = await Avatar_1.default.findOne({ userId: userObjectId }).exec();
        if (userAvatar?.imageFileId) {
            resolvedImageUrl = `/api/wardrobe/images/${userAvatar.imageFileId.toString()}`;
        }
        else if (userAvatar?.imageUrl) {
            resolvedImageUrl = userAvatar.imageUrl;
        }
    }
    if (!resolvedImageUrl) {
        throw new VirtualTryOnServiceError("User image is required. Please upload a photo, provide a userImageUrl, or set up an avatar.", 400);
    }
    // 2. Validate wardrobe items ownership
    const itemObjectIds = input.wardrobeItemIds.map((id) => toObjectId(id));
    const items = await WardrobeItem_1.default.find({
        _id: { $in: itemObjectIds },
        userId: userObjectId,
    })
        .select("_id")
        .lean()
        .exec();
    if (items.length !== itemObjectIds.length) {
        throw new VirtualTryOnServiceError("One or more clothing items were not found in your wardrobe.", 400);
    }
    // 3. Check AI Provider configuration
    const isAiConfigured = Boolean(process.env.AI_SERVICE_URL);
    // Create record
    const tryOnRecord = await VirtualTryOn_1.default.create({
        userId: userObjectId,
        wardrobeItemIds: itemObjectIds,
        tryOnType: input.tryOnType,
        userImageUrl: resolvedImageUrl,
        status: isAiConfigured ? "processing" : "failed",
        aiProvider: isAiConfigured ? "external-tryon-ai" : undefined,
        prompt: input.prompt,
        errorMessage: isAiConfigured ? undefined : "Virtual try-on AI service is currently unconfigured or offline.",
    });
    return tryOnRecord.toObject();
}
async function getTryOnSession(userId, tryOnId) {
    const userObjectId = toObjectId(userId);
    const sessionObjectId = toObjectId(tryOnId);
    const session = await VirtualTryOn_1.default.findOne({
        _id: sessionObjectId,
        userId: userObjectId,
    })
        .lean()
        .exec();
    if (!session) {
        throw new VirtualTryOnServiceError("Virtual try-on session not found.", 404);
    }
    return session;
}
async function getUserTryOns(userId, query = {}) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 10, 50);
    const filter = { userId: userObjectId };
    if (query.status)
        filter.status = query.status;
    const [items, total] = await Promise.all([
        VirtualTryOn_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
        VirtualTryOn_1.default.countDocuments(filter).exec(),
    ]);
    return {
        items,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function deleteTryOnSession(userId, tryOnId) {
    const userObjectId = toObjectId(userId);
    const sessionObjectId = toObjectId(tryOnId);
    const result = await VirtualTryOn_1.default.findOneAndDelete({
        _id: sessionObjectId,
        userId: userObjectId,
    }).exec();
    if (!result) {
        throw new VirtualTryOnServiceError("Virtual try-on session not found.", 404);
    }
    return { success: true, message: "Virtual try-on session deleted." };
}
