import type { ClothingItemInference } from "../../modules/wardrobe/wardrobe.types";

export interface AIClothingRecognitionResponse {
  predictions: ClothingItemInference[];
}
