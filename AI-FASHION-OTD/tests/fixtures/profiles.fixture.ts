
export const TEST_PROFILE_ID = "507f1f77bcf86cd799439012";

export const TEST_PROFILE = {
    _id: TEST_PROFILE_ID,
    userId: "507f1f77bcf86cd799439011",
    displayName: "Test User",
    bio: "Fashion enthusiast",
    avatarUrl: undefined,
    preferredStyles: ["casual", "minimalist"],
    preferredColors: ["black", "white", "blue"],
    preferredSeasons: ["summer", "winter"],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

export const TEST_PROFILE_UPDATE = {
    displayName: "Updated Test User",
    bio: "Interested in modern fashion",
    preferredStyles: ["formal", "smart-casual"],
    preferredColors: ["black", "grey"],
};
