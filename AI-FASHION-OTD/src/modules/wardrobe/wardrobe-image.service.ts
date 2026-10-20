
import mongoose, { Types } from "mongoose";

import { WardrobeItem } from "../../models/WardrobeItem";
import {
    saveImage,
    removeImage,
    GridFSServiceError,
} from "../../integrations/storage/gridfs.service";

export class WardrobeImageServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "WardrobeImageServiceError";
    }
}

export interface WardrobeImageUploadInput {
    filename: string;
    contentType: string;
    buffer: Buffer;
}

export interface WardrobeImageUploadResult {
    itemId: string;
    image: {
        fileId: string;
        filename: string;
        contentType: string;
        size: number;
    };
}

function validateObjectId(value: string, label: string): Types.ObjectId {
    if (!mongoose.isValidObjectId(value)) {
        throw new WardrobeImageServiceError(`Invalid ${label}.`, 400);
    }

    return new Types.ObjectId(value);
}

/**
 * Uploads an image and attaches it to a wardrobe item owned by the user.
 */
export async function uploadWardrobeItemImage(
    userId: string,
    itemId: string,
    input: WardrobeImageUploadInput,
): Promise<WardrobeImageUploadResult> {
    const ownerId = validateObjectId(userId, "user ID");
    const wardrobeItemId = validateObjectId(itemId, "wardrobe item ID");

    const item = await WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    });

    if (!item) {
        throw new WardrobeImageServiceError(
            "Wardrobe item not found.",
            404,
        );
    }

    let uploadedImage: Awaited<ReturnType<typeof saveImage>>;

    try {
        uploadedImage = await saveImage(input);
    } catch (error: unknown) {
        if (error instanceof GridFSServiceError) {
            throw new WardrobeImageServiceError(
                error.message,
                error.statusCode,
            );
        }

        throw new WardrobeImageServiceError(
            "Image upload failed.",
            500,
        );
    }

    const previousImageId = item.imageFileId;

    try {
        item.imageFileId = new Types.ObjectId(uploadedImage.fileId);
        await item.save();
    } catch {
        // Avoid leaving an orphaned GridFS image if the database update fails.
        try {
            await removeImage(uploadedImage.fileId);
        } catch {
            // Preserve the original database error.
        }

        throw new WardrobeImageServiceError(
            "Image was uploaded, but could not be attached to the wardrobe item.",
            500,
        );
    }

    // Remove the previous image only after the new image is saved successfully.
    if (previousImageId) {
        try {
            await removeImage(previousImageId.toString());
        } catch {
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
export async function deleteWardrobeItemImage(
    userId: string,
    itemId: string,
): Promise<void> {
    const ownerId = validateObjectId(userId, "user ID");
    const wardrobeItemId = validateObjectId(itemId, "wardrobe item ID");

    const item = await WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    });

    if (!item) {
        throw new WardrobeImageServiceError(
            "Wardrobe item not found.",
            404,
        );
    }

    if (!item.imageFileId) {
        throw new WardrobeImageServiceError(
            "This wardrobe item has no image.",
            404,
        );
    }

    const imageId = item.imageFileId.toString();

    try {
        await removeImage(imageId);
    } catch (error: unknown) {
        if (error instanceof GridFSServiceError) {
            throw new WardrobeImageServiceError(
                error.message,
                error.statusCode,
            );
        }

        throw new WardrobeImageServiceError(
            "Unable to delete the wardrobe image.",
            500,
        );
    }

    item.imageFileId = undefined;
    await item.save();
}
