export const TEST_WARDROBE_ITEM_ID = "507f1f77bcf86cd799439021";

export const TEST_WARDROBE_ITEM = {
    _id: TEST_WARDROBE_ITEM_ID,
    userId: "507f1f77bcf86cd799439011",
    name: "Classic White T-Shirt",
    category: "tops",
    color: "white",
    style: "casual",
    season: ["summer", "spring"],
    brand: "Uniqlo",
    notes: "Comfortable cotton basic",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

export const TEST_WARDROBE_ITEMS = [
    TEST_WARDROBE_ITEM,
    {
        _id: "507f1f77bcf86cd799439022",
        userId: "507f1f77bcf86cd799439011",
        name: "Slim Fit Blue Jeans",
        category: "bottoms",
        color: "blue",
        style: "casual",
        season: ["all-season"],
        brand: "Levi's",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    {
        _id: "507f1f77bcf86cd799439023",
        userId: "507f1f77bcf86cd799439011",
        name: "White Leather Sneakers",
        category: "shoes",
        color: "white",
        style: "minimalist",
        season: ["spring", "summer", "autumn"],
        brand: "Common Projects",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
];

