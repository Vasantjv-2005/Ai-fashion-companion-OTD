
import { describe, expect, it } from "vitest";
import { validateClothingInference } from "../../src/modules/wardrobe-intelligence/wardrobe-intelligence.validator";

const validInference = {
    name: "Black Cotton Shirt",
    category: "shirt",
    color: "black",
    secondaryColor: null,

    attributes: {
        style: "casual",
        sleeveLength: "full",
        fabric: "cotton",
        pattern: "solid",
        season: "winter",
        occasion: "everyday",
        brand: null,
    },

    confidence: {
        overall: 0.95,
        category: 0.98,
        color: 0.99,
        style: 0.90,
        fabric: 0.85,
    },

    image: {
        imageUrl: "https://example.com/shirt.jpg",
        storageKey: "wardrobe/shirt-001",
    },
};

// 10 valid clothing objects
const validSamples = [
    validInference,
    {
        ...validInference,
        name: "White T-Shirt",
        category: "tshirt",
        color: "white",
        attributes: { ...validInference.attributes, sleeveLength: "short", season: "summer" },
    },
    {
        ...validInference,
        name: "Beige Top",
        category: "top",
        color: "beige",
        attributes: { ...validInference.attributes, style: "minimalist" },
    },
    {
        ...validInference,
        name: "Blue Blouse",
        category: "blouse",
        color: "blue",
        attributes: { ...validInference.attributes, style: "elegant", fabric: "silk" },
    },
    {
        ...validInference,
        name: "Gray Trousers",
        category: "trousers",
        color: "gray",
        attributes: { ...validInference.attributes, style: "workwear" },
    },
    {
        ...validInference,
        name: "Blue Jeans",
        category: "jeans",
        color: "blue",
        attributes: { ...validInference.attributes, fabric: "denim", pattern: "solid" },
    },
    {
        ...validInference,
        name: "Green Shorts",
        category: "shorts",
        color: "green",
        attributes: { ...validInference.attributes, sleeveLength: "not-applicable", season: "summer" },
    },
    {
        ...validInference,
        name: "Pink Skirt",
        category: "skirt",
        color: "pink",
        attributes: { ...validInference.attributes, pattern: "floral" },
    },
    {
        ...validInference,
        name: "Red Dress",
        category: "dress",
        color: "red",
        attributes: { ...validInference.attributes, style: "romantic", occasion: "party" },
    },
    {
        ...validInference,
        name: "Navy Jacket",
        category: "jacket",
        color: "navy",
        attributes: { ...validInference.attributes, fabric: "wool", season: "winter" },
    },
];

// 10 invalid clothing objects
const invalidSamples: unknown[] = [
    { ...validInference, category: "electronics" },
    { ...validInference, color: "transparent" },
    { ...validInference, secondaryColor: "neon" },
    {
        ...validInference,
        attributes: { ...validInference.attributes, style: "sport" },
    },
    {
        ...validInference,
        attributes: { ...validInference.attributes, sleeveLength: "long" },
    },
    {
        ...validInference,
        attributes: { ...validInference.attributes, fabric: "organic cotton" },
    },
    {
        ...validInference,
        attributes: { ...validInference.attributes, pattern: "polka-dots" },
    },
    {
        ...validInference,
        attributes: { ...validInference.attributes, season: "monsoon" },
    },
    {
        ...validInference,
        attributes: { ...validInference.attributes, occasion: "daily wear" },
    },
    {
        ...validInference,
        confidence: { ...validInference.confidence, overall: 1.5 },
    },
];

describe("Clothing Inference Validation", () => {
    validSamples.forEach((sample, index) => {
        it(`accepts valid clothing object ${index + 1}`, () => {
            expect(validateClothingInference(sample).success).toBe(true);
        });
    });

    invalidSamples.forEach((sample, index) => {
        it(`rejects invalid clothing object ${index + 1}`, () => {
            expect(validateClothingInference(sample).success).toBe(false);
        });
    });

    it("rejects a missing clothing name", () => {
        const { name, ...data } = validInference;
        expect(validateClothingInference(data).success).toBe(false);
    });

    it("rejects an invalid image URL", () => {
        const data = {
            ...validInference,
            image: { ...validInference.image, imageUrl: "not-a-url" },
        };
        expect(validateClothingInference(data).success).toBe(false);
    });

    it("accepts null optional attributes", () => {
        const data = {
            ...validInference,
            attributes: {
                ...validInference.attributes,
                style: null,
                fabric: null,
                pattern: null,
            },
        };
        expect(validateClothingInference(data).success).toBe(true);
    });
});
