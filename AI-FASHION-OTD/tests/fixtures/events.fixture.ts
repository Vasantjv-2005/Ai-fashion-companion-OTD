export const TEST_EVENT_ID = "507f1f77bcf86cd799439013";

export const TEST_EVENT = {
    _id: TEST_EVENT_ID,
    userId: "507f1f77bcf86cd799439011",
    title: "Birthday Party",
    description: "An evening birthday celebration",
    eventType: "birthday",
    date: new Date("2026-12-15T18:00:00.000Z"),
    location: "Hyderabad",
    dressCode: "smart-casual",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

export const TEST_EVENT_UPDATE = {
    title: "Office Celebration",
    description: "An office celebration event",
    eventType: "work",
    dressCode: "formal",
};

export const TEST_EVENTS = [
    TEST_EVENT,
    {
        ...TEST_EVENT,
        _id: "507f1f77bcf86cd799439014",
        title: "Weekend Outing",
        eventType: "casual",
        dressCode: "casual",
    },
];
