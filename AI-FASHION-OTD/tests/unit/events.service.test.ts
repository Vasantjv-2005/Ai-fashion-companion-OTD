import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
}));

vi.mock("../../src/models/Event", () => ({
    default: {
        create: mocks.create,
        find: mocks.find,
        countDocuments: mocks.countDocuments,
        findOne: mocks.findOne,
        findOneAndUpdate: mocks.findOneAndUpdate,
        findOneAndDelete: mocks.findOneAndDelete,
    },
}));

import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    EventServiceError,
} from "../../src/modules/events/events.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_EVENT_ID = "507f1f77bcf86cd799439013";
const OTHER_EVENT_ID = "507f1f77bcf86cd799439014";

const makeEvent = (overrides: Record<string, unknown> = {}) => ({
    _id: new mongoose.Types.ObjectId(TEST_EVENT_ID),
    userId: new mongoose.Types.ObjectId(TEST_USER_ID),
    title: "Birthday Party",
    description: "An evening celebration",
    eventType: "birthday",
    date: new Date("2026-12-15T18:00:00.000Z"),
    location: "Hyderabad",
    dressCode: "smart-casual",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
});

function mockListQuery(result: unknown[] = []) {
    const query = {
        sort: vi.fn(),
        skip: vi.fn(),
        limit: vi.fn(),
        lean: vi.fn(),
        exec: vi.fn().mockResolvedValue(result),
    };

    query.sort.mockReturnValue(query);
    query.skip.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.lean.mockReturnValue(query);

    mocks.find.mockReturnValue(query);

    return query;
}

function mockSingleResultQuery(
    method: "findOne" | "findOneAndUpdate",
    result: unknown = null
) {
    const query = {
        lean: vi.fn(),
        exec: vi.fn().mockResolvedValue(result),
    };

    query.lean.mockReturnValue(query);
    mocks[method].mockReturnValue(query);

    return query;
}

function mockDeleteQuery(result: unknown = {}) {
    const query = {
        exec: vi.fn().mockResolvedValue(result),
    };

    mocks.findOneAndDelete.mockReturnValue(query);

    return query;
}

describe("Events service", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createEvent", () => {
        it("creates an event successfully", async () => {
            const event = makeEvent();

            mocks.create.mockResolvedValue({
                toObject: () => event,
            });

            const result = await createEvent(TEST_USER_ID, {
                title: "Birthday Party",
                description: "An evening celebration",
                eventType: "birthday",
                date: new Date("2026-12-15T18:00:00.000Z"),
                location: "Hyderabad",
                dressCode: "smart-casual",
            });

            expect(mocks.create).toHaveBeenCalledOnce();
            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: "Birthday Party",
                    userId: expect.any(mongoose.Types.ObjectId),
                })
            );
            expect(result.id).toBe(TEST_EVENT_ID);
            expect(result.userId).toBe(TEST_USER_ID);
            expect(result.title).toBe("Birthday Party");
        });

        it("rejects an invalid user ID", async () => {
            await expect(
                createEvent("invalid-user-id", {
                    title: "Birthday Party",
                    eventType: "birthday",
                    date: new Date("2026-12-15T18:00:00.000Z"),
                })
            ).rejects.toThrow(EventServiceError);

            expect(mocks.create).not.toHaveBeenCalled();
        });
    });

    describe("getEvents", () => {
        it("returns a paginated list of events", async () => {
            mockListQuery([
                makeEvent(),
                makeEvent({
                    _id: new mongoose.Types.ObjectId(OTHER_EVENT_ID),
                    title: "Weekend Outing",
                }),
            ]);

            mocks.countDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(2),
            });

            const result = await getEvents(TEST_USER_ID, {
                page: 1,
                limit: 10,
            });

            expect(result.items).toHaveLength(2);
            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
            });
        });

        it("applies event type and date filters", async () => {
            mockListQuery([]);
            mocks.countDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(0),
            });

            const fromDate = new Date("2026-12-01T00:00:00.000Z");
            const toDate = new Date("2026-12-31T23:59:59.000Z");

            await getEvents(TEST_USER_ID, {
                eventType: "birthday",
                fromDate,
                toDate,
            });

            const filter = mocks.find.mock.calls[0][0];

            expect(filter.eventType).toBe("birthday");
            expect(filter.date).toEqual({
                $gte: fromDate,
                $lte: toDate,
            });
        });

        it("applies search and sorting options", async () => {
            const query = mockListQuery([]);
            mocks.countDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(0),
            });

            await getEvents(TEST_USER_ID, {
                search: "birthday",
                sortBy: "title",
                sortOrder: "desc",
            });

            expect(query.sort).toHaveBeenCalledWith({
                title: -1,
            });

            const filter = mocks.find.mock.calls[0][0];

            expect(filter.$or).toHaveLength(3);
        });

        it("rejects an invalid user ID", async () => {
            await expect(
                getEvents("invalid-user-id")
            ).rejects.toThrow(EventServiceError);

            expect(mocks.find).not.toHaveBeenCalled();
        });
    });

    describe("getEventById", () => {
        it("returns an event belonging to the user", async () => {
            mockSingleResultQuery("findOne", makeEvent());

            const result = await getEventById(
                TEST_USER_ID,
                TEST_EVENT_ID
            );

            expect(mocks.findOne).toHaveBeenCalledWith({
                _id: TEST_EVENT_ID,
                userId: TEST_USER_ID,
            });
            expect(result.id).toBe(TEST_EVENT_ID);
            expect(result.title).toBe("Birthday Party");
        });

        it("throws 404 when the event does not exist", async () => {
            mockSingleResultQuery("findOne", null);

            await expect(
                getEventById(TEST_USER_ID, TEST_EVENT_ID)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Event not found.",
            });
        });

        it("rejects an invalid event ID", async () => {
            await expect(
                getEventById(TEST_USER_ID, "invalid-event-id")
            ).rejects.toThrow(EventServiceError);

            expect(mocks.findOne).not.toHaveBeenCalled();
        });
    });

    describe("updateEvent", () => {
        it("updates an event successfully", async () => {
            const updatedEvent = makeEvent({
                title: "Updated Birthday Party",
            });

            mockSingleResultQuery(
                "findOneAndUpdate",
                updatedEvent
            );

            const result = await updateEvent(
                TEST_USER_ID,
                TEST_EVENT_ID,
                { title: "Updated Birthday Party" }
            );

            expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
                {
                    _id: TEST_EVENT_ID,
                    userId: TEST_USER_ID,
                },
                {
                    $set: {
                        title: "Updated Birthday Party",
                    },
                },
                {
                    new: true,
                    runValidators: true,
                }
            );

            expect(result.title).toBe("Updated Birthday Party");
        });

        it("rejects an empty update", async () => {
            await expect(
                updateEvent(TEST_USER_ID, TEST_EVENT_ID, {})
            ).rejects.toMatchObject({
                statusCode: 400,
            });

            expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it("throws 404 when the event cannot be updated", async () => {
            mockSingleResultQuery("findOneAndUpdate", null);

            await expect(
                updateEvent(TEST_USER_ID, TEST_EVENT_ID, {
                    title: "Updated Event",
                })
            ).rejects.toMatchObject({
                statusCode: 404,
            });
        });
    });

    describe("deleteEvent", () => {
        it("deletes an event successfully", async () => {
            mockDeleteQuery(makeEvent());

            await expect(
                deleteEvent(TEST_USER_ID, TEST_EVENT_ID)
            ).resolves.toBeUndefined();

            expect(mocks.findOneAndDelete).toHaveBeenCalledWith({
                _id: TEST_EVENT_ID,
                userId: TEST_USER_ID,
            });
        });

        it("throws 404 when the event does not exist", async () => {
            mockDeleteQuery(null);

            await expect(
                deleteEvent(TEST_USER_ID, TEST_EVENT_ID)
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Event not found.",
            });
        });

        it("rejects an invalid event ID", async () => {
            await expect(
                deleteEvent(TEST_USER_ID, "invalid-event-id")
            ).rejects.toThrow(EventServiceError);

            expect(mocks.findOneAndDelete).not.toHaveBeenCalled();
        });
    });
});
