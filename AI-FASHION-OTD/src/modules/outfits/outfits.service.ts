import mongoose from "mongoose";

import Outfit from "../../models/Outfit";
import WardrobeItem from "../../models/WardrobeItem";

import type {
    CreateOutfitInput,
    UpdateOutfitInput,
} from "./outfits.validator";

export class OutfitServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "OutfitServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new OutfitServiceError("Invalid ID.", 400);
    }

    return new mongoose.Types.ObjectId(id);
}

/**
 * Verify that all clothing items exist and belong to the user.
 */
async function verifyWardrobeItems(
    userId: mongoose.Types.ObjectId,
    clothingItemIds: string[],
): Promise<mongoose.Types.ObjectId[]> {
    const itemIds = clothingItemIds.map((id) => toObjectId(id));


    const uniqueIds = new Set(itemIds.map((id) => id.toString()));

    if (uniqueIds.size !== itemIds.length) {
        throw new OutfitServiceError(
            "Duplicate clothing item IDs are not allowed.",
            400,
        );
    }

    const items = await WardrobeItem.find({
        _id: { $in: itemIds },
        userId,
    })
        .select("_id")
        .lean()
        .exec();

    if (items.length !== itemIds.length) {
        throw new OutfitServiceError(
            "One or more clothing items were not found in your wardrobe.",
            400,
        );
    }

    return itemIds;
}

/**
 * Create an outfit.
 */
export async function createOutfit(
    userId: string,
    input: CreateOutfitInput,
) {
    const userObjectId = toObjectId(userId);

    const clothingItemIds = await verifyWardrobeItems(
        userObjectId,
        input.clothingItemIds,
    );

    const outfit = new Outfit({
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
export async function getOutfits(
    userId: string,
    options: {
        page?: number;
        limit?: number;
        occasion?: CreateOutfitInput["occasion"];
        status?: CreateOutfitInput["status"];
    } = {},
) {
    const userObjectId = toObjectId(userId);

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(
        100,
        Math.max(1, Math.floor(options.limit ?? 10)),
    );

    const filter: Record<string, unknown> = {
        userId: userObjectId,
    };

    if (options.occasion) {
        filter.occasion = options.occasion;
    }

    if (options.status) {
        filter.status = options.status;
    }

    const [outfits, total] = await Promise.all([
        Outfit.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),

        Outfit.countDocuments(filter).exec(),
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
export async function getOutfitById(
    userId: string,
    outfitId: string,
) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);

    const outfit = await Outfit.findOne({
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
export async function updateOutfit(
    userId: string,
    outfitId: string,
    input: UpdateOutfitInput,
) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);

    const existingOutfit = await Outfit.findOne({
        _id: outfitObjectId,
        userId: userObjectId,
    })
        .select("_id")
        .lean()
        .exec();

    if (!existingOutfit) {
        throw new OutfitServiceError("Outfit not found.", 404);
    }

    const updateData: Record<string, unknown> = { ...input };

    if (input.clothingItemIds !== undefined) {
        updateData.clothingItemIds = await verifyWardrobeItems(
            userObjectId,
            input.clothingItemIds,
        );
    }

    const updatedOutfit = await Outfit.findOneAndUpdate(
        {
            _id: outfitObjectId,
            userId: userObjectId,
        },
        {
            $set: updateData,
        },
        {
            new: true,
            runValidators: true,
        },
    )
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
export async function deleteOutfit(
    userId: string,
    outfitId: string,
) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(outfitId);

    const deletedOutfit = await Outfit.findOneAndDelete({
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
