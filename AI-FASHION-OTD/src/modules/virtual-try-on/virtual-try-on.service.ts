import mongoose from "mongoose";
import VirtualTryOn from "../../models/VirtualTryOn";
import WardrobeItem from "../../models/WardrobeItem";
import Avatar from "../../models/Avatar";
import { saveImage } from "../../integrations/storage/gridfs.service";
import { validateImageFile } from "../../utils/file-validation";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type { CreateTryOnDto } from "./virtual-try-on.validator";

export class VirtualTryOnServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "VirtualTryOnServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new VirtualTryOnServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function createTryOnSession(
    userId: string,
    input: CreateTryOnDto,
    uploadedFile?: Express.Multer.File,
) {
    const userObjectId = toObjectId(userId);

    // 1. Resolve user model image
    let resolvedImageUrl = input.userImageUrl;

    if (uploadedFile) {
        const fileCheck = validateImageFile(uploadedFile);
        if (!fileCheck.isValid) {
            throw new VirtualTryOnServiceError(fileCheck.error || "Invalid user image file.", 400);
        }

        const saved = await saveImage({
            filename: `tryon-user-${userId}-${Date.now()}`,
            contentType: uploadedFile.mimetype,
            buffer: uploadedFile.buffer,
        });
        resolvedImageUrl = `/api/wardrobe/images/${saved.fileId}`;
    }

    if (!resolvedImageUrl) {
        // Fallback: check user's avatar
        const userAvatar = await Avatar.findOne({ userId: userObjectId }).exec();
        if (userAvatar?.imageFileId) {
            resolvedImageUrl = `/api/wardrobe/images/${userAvatar.imageFileId.toString()}`;
        } else if (userAvatar?.imageUrl) {
            resolvedImageUrl = userAvatar.imageUrl;
        }
    }

    if (!resolvedImageUrl) {
        throw new VirtualTryOnServiceError(
            "User image is required. Please upload a photo, provide a userImageUrl, or set up an avatar.",
            400,
        );
    }

    // 2. Validate wardrobe items ownership
    const itemObjectIds = input.wardrobeItemIds.map((id) => toObjectId(id));
    const items = await WardrobeItem.find({
        _id: { $in: itemObjectIds },
        userId: userObjectId,
    })
        .select("_id")
        .lean()
        .exec();

    if (items.length !== itemObjectIds.length) {
        throw new VirtualTryOnServiceError(
            "One or more clothing items were not found in your wardrobe.",
            400,
        );
    }

    // 3. Check AI Provider configuration
    const isAiConfigured = Boolean(process.env.AI_SERVICE_URL);

    // Create record
    const tryOnRecord = await VirtualTryOn.create({
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

export async function getTryOnSession(userId: string, tryOnId: string) {
    const userObjectId = toObjectId(userId);
    const sessionObjectId = toObjectId(tryOnId);

    const session = await VirtualTryOn.findOne({
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

export async function getUserTryOns(
    userId: string,
    query: { page?: number | string; limit?: number | string; status?: string } = {},
) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = parsePagination(query, 10, 50);

    const filter: Record<string, unknown> = { userId: userObjectId };
    if (query.status) filter.status = query.status;

    const [items, total] = await Promise.all([
        VirtualTryOn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
        VirtualTryOn.countDocuments(filter).exec(),
    ]);

    return {
        items,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function deleteTryOnSession(userId: string, tryOnId: string) {
    const userObjectId = toObjectId(userId);
    const sessionObjectId = toObjectId(tryOnId);

    const result = await VirtualTryOn.findOneAndDelete({
        _id: sessionObjectId,
        userId: userObjectId,
    }).exec();

    if (!result) {
        throw new VirtualTryOnServiceError("Virtual try-on session not found.", 404);
    }

    return { success: true, message: "Virtual try-on session deleted." };
}

