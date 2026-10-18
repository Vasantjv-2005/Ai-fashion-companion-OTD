
import { WardrobeItem } from "../../models/WardrobeItem";
import type { ClothingItemInference } from "./types";

export async function createWardrobeItem(
  userId: string,
  inference: ClothingItemInference,
) {
  const item = await WardrobeItem.create({
    name: inference.name.trim(),
    category: inference.category,
    color: inference.color.trim().toLowerCase(),
    secondary_color: inference.secondaryColor,
    fabric: inference.attributes.fabric,
    pattern: inference.attributes.pattern,
    style: inference.attributes.style,
    season: inference.attributes.season,
    occasion: inference.attributes.occasion,
    brand: inference.attributes.brand,
    user_id: userId,
  });

  return item;
}
