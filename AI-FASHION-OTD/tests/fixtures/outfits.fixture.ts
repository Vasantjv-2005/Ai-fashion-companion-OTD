export const TEST_OUTFIT_ID = "507f1f77bcf86cd799439015";

export const TEST_OUTFIT = {
    _id: TEST_OUTFIT_ID,
    userId: "507f1f77bcf86cd799439011",
    name: "Casual Summer Look",
    description: "A comfortable outfit for warm weather",
    items: [
        {
            wardrobeItemId: "507f1f77bcf86cd799439021",
            category: "tops",
        },
        {
            wardrobeItemId: "507f1f77bcf86cd799439022",
            category: "bottoms",
        },
        {
            wardrobeItemId: "507f1f77bcf86cd799439023",
            category: "shoes",
        },
    ],
    occasion: "casual",
    season: "summer",
    style: "minimalist",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

export const TEST_OUTFIT_UPDATE = {
    name: "Updated Summer Look",
    description: "An updated casual summer outfit",
    occasion: "weekend",
    style: "smart-casual",
};

export const TEST_OUTFITS = [
    TEST_OUTFIT,
    {
        ...TEST_OUTFIT,
        _id: "507f1f77bcf86cd799439016",
        name: "Formal Office Look",
        occasion: "work",
        season: "all-season",
        style: "formal",
    },
];
