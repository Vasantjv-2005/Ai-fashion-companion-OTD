
import { Schema, model, Types } from "mongoose";

export interface IWardrobeItem {
  _id: Types.ObjectId;
  name: string;
  category: string;
  color: string;
  secondary_color: string | null;
  fabric: string | null;
  pattern: string | null;
  style: string | null;
  season: string | null;
  occasion: string | null;
  brand: string | null;
  description: string | null;
  is_favorite: boolean;
  user_id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wardrobeItemSchema = new Schema<IWardrobeItem>(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    secondary_color: { type: String, default: null },
    fabric: { type: String, default: null },
    pattern: { type: String, default: null },
    style: { type: String, default: null },
    season: { type: String, default: null },
    occasion: { type: String, default: null },
    brand: { type: String, default: null },
    description: { type: String, default: null },
    is_favorite: { type: Boolean, default: false },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "wardrobe_items",
  },
);

export const WardrobeItem = model<IWardrobeItem>(
  "WardrobeItem",
  wardrobeItemSchema,
);
