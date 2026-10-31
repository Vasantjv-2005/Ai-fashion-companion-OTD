
import { describe, expect, it } from "vitest";
import {
    validateClothingInference,
    validateClothingInferenceList,
} from "../../src/modules/wardrobe-intelligence/wardrobe-intelligence.validator";

const validItem = {
    name: "Black Cotton Shirt",
    category: "tops",
    clothingType: "shirt",
    color: "black",
    style: "casual",
    confidence: 0.92,
};

describe("Clothing inference validation", () => {
    it("accepts valid clothing objects", () => {
        const validItems = [
            validItem,
            { ...validItem, clothingType: "jeans", category: "bottoms" },
            { ...validItem, clothingType: "dress", category: "dresses" },
            { ...validItem, clothingType: "jacket", category: "outerwear" },
            { ...validItem, clothingType: "shoes", category: "shoes" },
            { ...validItem, clothingType: "accessory", category: "accessories" },
            { ...validItem, sleeveType: "long-sleeve" },
            { ...validItem, pattern: "striped" },
            { ...validItem, material: "cotton" },
            { ...validItem, formality: "formal" },
            { ...validItem, season: ["summer", "winter"] },
        ];

        for (const item of validItems) {
            expect(validateClothingInference(item).success).toBe(true);
        }
    });

    it("rejects invalid clothing objects", () => {
        const invalidItems = [
            { ...validItem, name: "" },
            { ...validItem, category: "invalid-category" },
            { ...validItem, clothingType: "invalid-type" },
            { ...validItem, color: "" },
            { ...validItem, style: "invalid-style" },
            { ...validItem, confidence: -0.1 },
            { ...validItem, confidence: 1.1 },
            { ...validItem, confidence: NaN },
            { ...validItem, sleeveType: "invalid-sleeve" },
            { ...validItem, pattern: "invalid-pattern" },
            { ...validItem, material: "invalid-material" },
            { ...validItem, season: ["summer", "summer"] },
            { ...validItem, unexpectedField: "not allowed" },
        ];

        for (const item of invalidItems) {
            expect(validateClothingInference(item).success).toBe(false);
        }
    });

    it("rejects an empty prediction list", () => {
        expect(validateClothingInferenceList([]).success).toBe(false);
    });

    it("accepts a valid prediction list", () => {
        expect(validateClothingInferenceList([validItem]).success).toBe(true);
    });
});
