import mongoose from "mongoose";
import Avatar from "../../models/Avatar";
import Profile from "../../models/Profile";
import { saveImage, removeImage } from "../../integrations/storage/gridfs.service";
import { validateImageFile } from "../../utils/file-validation";
import type { CreateAvatarDto, UpdateAvatarDto } from "./avatar.validator";

export class AvatarServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "AvatarServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new AvatarServiceError("Invalid user ID.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function getAvatar(userId: string) {
    const userObjectId = toObjectId(userId);
    const avatar = await Avatar.findOne({ userId: userObjectId }).lean().exec();

    if (!avatar) {
        throw new AvatarServiceError("Avatar not found.", 404);
    }

    return avatar;
}

export async function createOrUpdateAvatar(
    userId: string,
    input: CreateAvatarDto | UpdateAvatarDto,
) {
    const userObjectId = toObjectId(userId);

    const updateData: Record<string, unknown> = { ...input };
    if (input.imageFileId) {
        updateData.imageFileId = new mongoose.Types.ObjectId(input.imageFileId);
    }

    const avatar = await Avatar.findOneAndUpdate(
        { userId: userObjectId },
        {
            $set: {
                ...updateData,
                userId: userObjectId,
            },
        },
        { new: true, upsert: true, runValidators: true },
    )
        .lean()
        .exec();

    // Sync with Profile.avatarFileId if an image is attached
    if (avatar && avatar.imageFileId) {
        await Profile.updateOne(
            { userId: userObjectId },
            { $set: { avatarFileId: avatar.imageFileId } },
        ).exec();
    }

    return avatar;
}

export async function uploadAvatarImage(
    userId: string,
    file?: Express.Multer.File,
) {
    const validation = validateImageFile(file);
    if (!validation.isValid || !file) {
        throw new AvatarServiceError(
            validation.error || "A valid image file is required.",
            400,
        );
    }

    const userObjectId = toObjectId(userId);

    // Save image to GridFS
    const uploadResult = await saveImage({
        filename: `avatar-${userId}-${Date.now()}`,
        contentType: file.mimetype,
        buffer: file.buffer,
    });

    // Check if user already has an existing avatar with an old image to clean up
    const existing = await Avatar.findOne({ userId: userObjectId }).exec();
    if (existing && existing.imageFileId) {
        try {
            await removeImage(existing.imageFileId.toString());
        } catch {
            // Ignore error if old file not found
        }
    }

    const avatar = await Avatar.findOneAndUpdate(
        { userId: userObjectId },
        {
            $set: {
                userId: userObjectId,
                imageFileId: new mongoose.Types.ObjectId(uploadResult.fileId),
                source: "upload",
                isActive: true,
            },
        },
        { new: true, upsert: true },
    )
        .lean()
        .exec();

    // Also update Profile
    await Profile.updateOne(
        { userId: userObjectId },
        { $set: { avatarFileId: new mongoose.Types.ObjectId(uploadResult.fileId) } },
    ).exec();

    return avatar;
}

export async function deleteAvatar(userId: string) {
    const userObjectId = toObjectId(userId);

    const avatar = await Avatar.findOneAndDelete({ userId: userObjectId }).exec();

    if (!avatar) {
        throw new AvatarServiceError("Avatar not found.", 404);
    }

    if (avatar.imageFileId) {
        try {
            await removeImage(avatar.imageFileId.toString());
        } catch {
            // Ignore cleanup failure
        }
    }

    await Profile.updateOne(
        { userId: userObjectId },
        { $unset: { avatarFileId: 1 } },
    ).exec();

    return { success: true, message: "Avatar deleted successfully." };
}

