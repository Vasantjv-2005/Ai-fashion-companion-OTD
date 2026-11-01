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
exports.WardrobeImageServiceError = void 0;
exports.uploadWardrobeItemImage = uploadWardrobeItemImage;
exports.deleteWardrobeItemImage = deleteWardrobeItemImage;
const mongoose_1 = __importStar(require("mongoose"));
const WardrobeItem_1 = require("../../models/WardrobeItem");
const gridfs_service_1 = require("../../integrations/storage/gridfs.service");
class WardrobeImageServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "WardrobeImageServiceError";
    }
}
exports.WardrobeImageServiceError = WardrobeImageServiceError;
function validateObjectId(value, label) {
    if (!mongoose_1.default.isValidObjectId(value)) {
        throw new WardrobeImageServiceError(`Invalid ${label}.`, 400);
    }
    return new mongoose_1.Types.ObjectId(value);
}
/**
 * Uploads an image and attaches it to a wardrobe item owned by the user.
 */
async function uploadWardrobeItemImage(userId, itemId, input) {
    const ownerId = validateObjectId(userId, "user ID");
    const wardrobeItemId = validateObjectId(itemId, "wardrobe item ID");
    const item = await WardrobeItem_1.WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    });
    if (!item) {
        throw new WardrobeImageServiceError("Wardrobe item not found.", 404);
    }
    let uploadedImage;
    try {
        uploadedImage = await (0, gridfs_service_1.saveImage)(input);
    }
    catch (error) {
        if (error instanceof gridfs_service_1.GridFSServiceError) {
            throw new WardrobeImageServiceError(error.message, error.statusCode);
        }
        throw new WardrobeImageServiceError("Image upload failed.", 500);
    }
    const previousImageId = item.imageFileId;
    try {
        item.imageFileId = new mongoose_1.Types.ObjectId(uploadedImage.fileId);
        await item.save();
    }
    catch {
        // Avoid leaving an orphaned GridFS image if the database update fails.
        try {
            await (0, gridfs_service_1.removeImage)(uploadedImage.fileId);
        }
        catch {
            // Preserve the original database error.
        }
        throw new WardrobeImageServiceError("Image was uploaded, but could not be attached to the wardrobe item.", 500);
    }
    // Remove the previous image only after the new image is saved successfully.
    if (previousImageId) {
        try {
            await (0, gridfs_service_1.removeImage)(previousImageId.toString());
        }
        catch {
            // The new image is already attached; cleanup can be retried separately.
        }
    }
    return {
        itemId: item.id,
        image: uploadedImage,
    };
}
/**
 * Removes an image from a wardrobe item owned by the user.
 */
async function deleteWardrobeItemImage(userId, itemId) {
    const ownerId = validateObjectId(userId, "user ID");
    const wardrobeItemId = validateObjectId(itemId, "wardrobe item ID");
    const item = await WardrobeItem_1.WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    });
    if (!item) {
        throw new WardrobeImageServiceError("Wardrobe item not found.", 404);
    }
    if (!item.imageFileId) {
        throw new WardrobeImageServiceError("This wardrobe item has no image.", 404);
    }
    const imageId = item.imageFileId.toString();
    try {
        await (0, gridfs_service_1.removeImage)(imageId);
    }
    catch (error) {
        if (error instanceof gridfs_service_1.GridFSServiceError) {
            throw new WardrobeImageServiceError(error.message, error.statusCode);
        }
        throw new WardrobeImageServiceError("Unable to delete the wardrobe image.", 500);
    }
    item.imageFileId = undefined;
    await item.save();
}
