import mongoose, { Types } from "mongoose";

import { WardrobeItem } from "../../models/WardrobeItem";

import type {
    CreateWardrobeItemInput,
    UpdateWardrobeItemInput,
    WardrobeItemResponse,
    WardrobeListOptions,
    PaginatedWardrobeResponse,
} from "./wardrobe.types";

export class WardrobeServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "WardrobeServiceError";
    }
}

function validateUserId(userId: string): Types.ObjectId {
    if (!mongoose.isValidObjectId(userId)) {
        throw new WardrobeServiceError("Invalid user ID.", 400);
    }

    return new Types.ObjectId(userId);
}

function validateItemId(itemId: string): Types.ObjectId {
    if (!mongoose.isValidObjectId(itemId)) {
        throw new WardrobeServiceError("Invalid wardrobe item ID.", 400);
    }

    return new Types.ObjectId(itemId);
}

function toWardrobeItemResponse(
    item: Record<string, unknown> & {
        _id?: unknown;
        userId?: unknown;
        createdAt?: Date;
        updatedAt?: Date;
    },
): WardrobeItemResponse {
    return {
        id: String(item._id),
        userId: String(item.userId),
        name: item.name as string,
        category: item.category as WardrobeItemResponse["category"],
        color: item.color as string,
        style: item.style as WardrobeItemResponse["style"],
        season: item.season as WardrobeItemResponse["season"],
        ...(item.brand !== undefined ? { brand: item.brand as string } : {}),
        ...(item.notes !== undefined ? { notes: item.notes as string } : {}),
        ...(item.imageFileId !== undefined
            ? { imageFileId: String(item.imageFileId) }
            : {}),
        createdAt: item.createdAt as Date,
        updatedAt: item.updatedAt as Date,
    };
}

export async function createWardrobeItem(
    userId: string,
    input: CreateWardrobeItemInput,
): Promise<WardrobeItemResponse> {
    const ownerId = validateUserId(userId);

    const item = await WardrobeItem.create({
        ...input,
        userId: ownerId,
    });

    return toWardrobeItemResponse(
        item.toObject() as unknown as Parameters<
            typeof toWardrobeItemResponse
        >[0],
    );
}

export async function getWardrobeItems(
    userId: string,
    options: WardrobeListOptions = {},
): Promise<PaginatedWardrobeResponse> {
    const ownerId = validateUserId(userId);

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));

    const filter: Record<string, unknown> = {
        userId: ownerId,
    };

    if (options.category) filter.category = options.category;
    if (options.style) filter.style = options.style;

    if (options.color) {
        filter.color = {
            $regex: options.color.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
        };
    }

    if (options.season) filter.season = options.season;

    if (options.search) {
        const escapedSearch = options.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
        );

        filter.$or = [
            { name: { $regex: escapedSearch, $options: "i" } },
            { brand: { $regex: escapedSearch, $options: "i" } },
            { notes: { $regex: escapedSearch, $options: "i" } },
        ];
    }

    const sortBy = options.sortBy ?? "createdAt";
    const sortOrder = options.sortOrder === "asc" ? 1 : -1;

    const [items, totalItems] = await Promise.all([
        WardrobeItem.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),
        WardrobeItem.countDocuments(filter).exec(),
    ]);

    return {
        items: items.map((item) =>
            toWardrobeItemResponse(
                item as unknown as Parameters<
                    typeof toWardrobeItemResponse
                >[0],
            ),
        ),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}

export async function getWardrobeItemById(
    userId: string,
    itemId: string,
): Promise<WardrobeItemResponse> {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);

    const item = await WardrobeItem.findOne({
        _id: wardrobeItemId,
        userId: ownerId,
    }).lean().exec();

    if (!item) {
        throw new WardrobeServiceError(
            "Wardrobe item not found.",
            404,
        );
    }

    return toWardrobeItemResponse(
        item as unknown as Parameters<typeof toWardrobeItemResponse>[0],
    );
}

export async function updateWardrobeItem(
    userId: string,
    itemId: string,
    input: UpdateWardrobeItemInput,
): Promise<WardrobeItemResponse> {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);

    if (Object.keys(input).length === 0) {
        throw new WardrobeServiceError(
            "Provide at least one field to update.",
            400,
        );
    }

    const item = await WardrobeItem.findOneAndUpdate(
        {
            _id: wardrobeItemId,
            userId: ownerId,
        },
        { $set: input },
        {
            new: true,
            runValidators: true,
        },
    ).lean().exec();

    if (!item) {
        throw new WardrobeServiceError(
            "Wardrobe item not found.",
            404,
        );
    }

    return toWardrobeItemResponse(
        item as unknown as Parameters<typeof toWardrobeItemResponse>[0],
    );
}

export async function deleteWardrobeItem(
    userId: string,
    itemId: string,
): Promise<void> {
    const ownerId = validateUserId(userId);
    const wardrobeItemId = validateItemId(itemId);

    const deletedItem = await WardrobeItem.findOneAndDelete({
        _id: wardrobeItemId,
        userId: ownerId,
    }).exec();

    if (!deletedItem) {
        throw new WardrobeServiceError(
            "Wardrobe item not found.",
            404,
        );
    }
}
