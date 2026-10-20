import mongoose, {
    Schema,
    type Document,
    type Model,
    type Types,
} from "mongoose";

import {
    CLOTHING_CATEGORIES,
    CLOTHING_SEASONS,
    CLOTHING_STYLES,
    type ClothingCategory,
    type ClothingSeason,
    type ClothingStyle,
} from "../modules/wardrobe/wardrobe.types";

export interface IWardrobeItem extends Document {
    userId: Types.ObjectId;
    name: string;
    category: ClothingCategory;
    color: string;
    style: ClothingStyle;
    season: ClothingSeason[];
    brand?: string;
    notes?: string;
    imageFileId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const wardrobeItemSchema = new Schema<IWardrobeItem>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 100,
        },
        category: {
            type: String,
            enum: [...CLOTHING_CATEGORIES],
            required: true,
            index: true,
        },
        color: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },
        style: {
            type: String,
            enum: [...CLOTHING_STYLES],
            required: true,
            index: true,
        },
        season: {
            type: [{
                type: String,
                enum: [...CLOTHING_SEASONS],
            }],
            required: true,
            validate: {
                validator: (seasons: string[]) =>
                    seasons.length > 0 &&
                    new Set(seasons).size === seasons.length,
                message: "At least one unique season is required.",
            },
        },
        brand: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        imageFileId: {
            type: Schema.Types.ObjectId,
            default: undefined,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "wardrobe_items",
    },
);

wardrobeItemSchema.index({
    userId: 1,
    createdAt: -1,
});

wardrobeItemSchema.index({
    userId: 1,
    category: 1,
});

wardrobeItemSchema.index({
    userId: 1,
    name: 1,
});

export const WardrobeItem: Model<IWardrobeItem> =
    (mongoose.models.WardrobeItem as Model<IWardrobeItem> | undefined) ??
    mongoose.model<IWardrobeItem>(
        "WardrobeItem",
        wardrobeItemSchema,
    );

export default WardrobeItem;
