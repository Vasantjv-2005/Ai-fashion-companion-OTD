"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarServiceError = void 0;
exports.getAvatar = getAvatar;
exports.createOrUpdateAvatar = createOrUpdateAvatar;
exports.uploadAvatarImage = uploadAvatarImage;
exports.deleteAvatar = deleteAvatar;
const mongoose_1 = __importDefault(require("mongoose"));
const Avatar_1 = __importDefault(require("../../models/Avatar"));
const Profile_1 = __importDefault(require("../../models/Profile"));
const gridfs_service_1 = require("../../integrations/storage/gridfs.service");
const file_validation_1 = require("../../utils/file-validation");
class AvatarServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AvatarServiceError";
    }
}
exports.AvatarServiceError = AvatarServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new AvatarServiceError("Invalid user ID.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function getAvatar(userId) {
    const userObjectId = toObjectId(userId);
    const avatar = await Avatar_1.default.findOne({ userId: userObjectId }).lean().exec();
    if (!avatar) {
        throw new AvatarServiceError("Avatar not found.", 404);
    }
    return avatar;
}
async function createOrUpdateAvatar(userId, input) {
    const userObjectId = toObjectId(userId);
    const updateData = { ...input };
    if (input.imageFileId) {
        updateData.imageFileId = new mongoose_1.default.Types.ObjectId(input.imageFileId);
    }
    const avatar = await Avatar_1.default.findOneAndUpdate({ userId: userObjectId }, {
        $set: {
            ...updateData,
            userId: userObjectId,
        },
    }, { new: true, upsert: true, runValidators: true })
        .lean()
        .exec();
    // Sync with Profile.avatarFileId if an image is attached
    if (avatar && avatar.imageFileId) {
        await Profile_1.default.updateOne({ userId: userObjectId }, { $set: { avatarFileId: avatar.imageFileId } }).exec();
    }
    return avatar;
}
async function uploadAvatarImage(userId, file) {
    const validation = (0, file_validation_1.validateImageFile)(file);
    if (!validation.isValid || !file) {
        throw new AvatarServiceError(validation.error || "A valid image file is required.", 400);
    }
    const userObjectId = toObjectId(userId);
    // Save image to GridFS
    const uploadResult = await (0, gridfs_service_1.saveImage)({
        filename: `avatar-${userId}-${Date.now()}`,
        contentType: file.mimetype,
        buffer: file.buffer,
    });
    // Check if user already has an existing avatar with an old image to clean up
    const existing = await Avatar_1.default.findOne({ userId: userObjectId }).exec();
    if (existing && existing.imageFileId) {
        try {
            await (0, gridfs_service_1.removeImage)(existing.imageFileId.toString());
        }
        catch {
            // Ignore error if old file not found
        }
    }
    const avatar = await Avatar_1.default.findOneAndUpdate({ userId: userObjectId }, {
        $set: {
            userId: userObjectId,
            imageFileId: new mongoose_1.default.Types.ObjectId(uploadResult.fileId),
            source: "upload",
            isActive: true,
        },
    }, { new: true, upsert: true })
        .lean()
        .exec();
    // Also update Profile
    await Profile_1.default.updateOne({ userId: userObjectId }, { $set: { avatarFileId: new mongoose_1.default.Types.ObjectId(uploadResult.fileId) } }).exec();
    return avatar;
}
async function deleteAvatar(userId) {
    const userObjectId = toObjectId(userId);
    const avatar = await Avatar_1.default.findOneAndDelete({ userId: userObjectId }).exec();
    if (!avatar) {
        throw new AvatarServiceError("Avatar not found.", 404);
    }
    if (avatar.imageFileId) {
        try {
            await (0, gridfs_service_1.removeImage)(avatar.imageFileId.toString());
        }
        catch {
            // Ignore cleanup failure
        }
    }
    await Profile_1.default.updateOne({ userId: userObjectId }, { $unset: { avatarFileId: 1 } }).exec();
    return { success: true, message: "Avatar deleted successfully." };
}
