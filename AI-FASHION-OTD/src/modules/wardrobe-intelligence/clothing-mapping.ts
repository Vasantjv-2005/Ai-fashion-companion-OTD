
import type { ClothingCategory as AICategory } from "../../integrations/ai/ai.types";
import type {
    ClothingCategory,
    ClothingStyle,
    ClothingSeason,
} from "../wardrobe/wardrobe.types";

export function mapClothingCategory(
    category: AICategory,
): ClothingCategory {
    switch (category) {
        case "shirt":
        case "tshirt":
        case "top":
        case "blouse":
            return "tops";

        case "trousers":
        case "jeans":
        case "shorts":
        case "skirt":
            return "bottoms";

        case "dress":
            return "dresses";

        case "jacket":
        case "coat":
        case "sweater":
        case "hoodie":
        case "suit":
            return "outerwear";

        case "shoes":
            return "shoes";

        case "accessory":
            return "accessories";

        case "other":
            return "other";
    }
}

export function mapClothingStyle(
    styles: string[] | undefined,
): ClothingStyle | undefined {
    const allowedStyles: ClothingStyle[] = [
        "casual",
        "formal",
        "smart-casual",
        "streetwear",
        "sporty",
        "traditional",
        "party",
        "minimalist",
        "other",
    ];

    return styles?.find((style): style is ClothingStyle =>
        allowedStyles.includes(style as ClothingStyle),
    );
}

export function mapClothingSeasons(
    seasons: string[] | undefined,
): ClothingSeason[] {
    const allowedSeasons: ClothingSeason[] = [
        "spring",
        "summer",
        "autumn",
        "winter",
        "all-season",
    ];

    const mapped = (seasons ?? []).filter(
        (season): season is ClothingSeason =>
            allowedSeasons.includes(season as ClothingSeason),
    );

    return [...new Set(mapped)];
}
