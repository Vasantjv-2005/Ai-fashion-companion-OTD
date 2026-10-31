import type {
    ClothingCategory,
    ClothingStyle,
} from "../wardrobe/wardrobe.types";

const ALLOWED_CATEGORIES: ClothingCategory[] = [
    "shirt",
    "tshirt",
    "trousers",
    "jeans",
    "dress",
    "skirt",
    "jacket",
    "coat",
    "sweater",
    "shoes",
    "accessory",
    "other",
];

const ALLOWED_STYLES: ClothingStyle[] = [
    "casual",
    "formal",
    "sport",
    "traditional",
    "party",
    "other",
];

export function mapClothingCategory(
    category: string,
): ClothingCategory | undefined {
    const normalized = category.trim().toLowerCase();

    if (
        ALLOWED_CATEGORIES.includes(
            normalized as ClothingCategory,
        )
    ) {
        return normalized as ClothingCategory;
    }

    return undefined;
}

export function mapClothingStyle(
    styles: string[] | undefined,
): ClothingStyle | undefined {
    return styles?.find((style): style is ClothingStyle =>
        ALLOWED_STYLES.includes(style as ClothingStyle),
    );
}
