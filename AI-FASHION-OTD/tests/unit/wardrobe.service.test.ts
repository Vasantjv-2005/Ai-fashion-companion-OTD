
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    create: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
}));

vi.mock("../../src/models/WardrobeItem", () => ({
    WardrobeItem: {
        create: mocks.create,
        find: mocks.find,
        countDocuments: mocks.countDocuments,
        findOne: mocks.findOne,
        findOneAndUpdate: mocks.findOneAndUpdate,
        findOneAndDelete: mocks.findOneAndDelete,
    },
}));

import {
    WardrobeServiceError,
    createWardrobeItem,
    getWardrobeItems,
    getWardrobeItemById,
    updateWardrobeItem,
    deleteWardrobeItem,
} from "../../src/modules/wardrobe/wardrobe.service";

const USER_ID = "507f1f77bcf86cd799439011";
const ITEM_ID = "507f1f77bcf86cd799439012";

const databaseItem = {
    _id: ITEM_ID,
    userId: USER_ID,
    name: "Blue T-shirt",
    category: "tops",
    color: "blue",
    style: "casual",
    season: ["summer"],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

const createInput = {
    name: "Blue T-shirt",
    category: "tops" as const,
    color: "blue",
    style: "casual" as const,
    season: ["summer"] as ("spring" | "summer" | "autumn" | "winter" | "all-season")[],
};

function createQuery<T>(result: T) {
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

    return query;
}

describe("Wardrobe service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createWardrobeItem", () => {
        it("creates an item for the specified user", async () => {
            mocks.create.mockResolvedValue({
                toObject: () => databaseItem,
            });

            const result = await createWardrobeItem(
                USER_ID,
                createInput,
            );

            expect(mocks.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    ...createInput,
                    userId: expect.anything(),
                }),
            );

            expect(result.id).toBe(ITEM_ID);
            expect(result.userId).toBe(USER_ID);
            expect(result.name).toBe("Blue T-shirt");
        });

        it("rejects an invalid user ID", async () => {
            await expect(
                createWardrobeItem("invalid-user-id", createInput),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 400,
            });

            expect(mocks.create).not.toHaveBeenCalled();
        });
    });

    describe("getWardrobeItems", () => {
        it("returns paginated wardrobe items", async () => {
            const query = createQuery([databaseItem]);

            mocks.find.mockReturnValue(query);
            mocks.countDocuments.mockReturnValue(
                createQuery(21),
            );

            const result = await getWardrobeItems(USER_ID, {
                page: 2,
                limit: 10,
            });

            expect(result.items).toHaveLength(1);
            expect(result.items[0].id).toBe(ITEM_ID);
            expect(result.pagination).toEqual({
                page: 2,
                limit: 10,
                totalItems: 21,
                totalPages: 3,
            });

            expect(query.skip).toHaveBeenCalledWith(10);
            expect(query.limit).toHaveBeenCalledWith(10);
        });

        it("applies category, style, season, color, and search filters", async () => {
            const query = createQuery([databaseItem]);

            mocks.find.mockReturnValue(query);
            mocks.countDocuments.mockReturnValue(
                createQuery(1),
            );

            await getWardrobeItems(USER_ID, {
                category: "tops",
                style: "casual",
                season: "summer",
                color: "Blue",
                search: "T-shirt",
            });

            const filter = mocks.find.mock.calls[0][0];

            expect(filter.category).toBe("tops");
            expect(filter.style).toBe("casual");
            expect(filter.season).toBe("summer");
            expect(filter.color).toEqual({
                $regex: "Blue",
                $options: "i",
            });
            expect(filter.$or).toHaveLength(3);
            expect(filter.userId).toBeDefined();
        });

        it("uses default pagination and sorting", async () => {
            const query = createQuery([]);

            mocks.find.mockReturnValue(query);
            mocks.countDocuments.mockReturnValue(
                createQuery(0),
            );

            const result = await getWardrobeItems(USER_ID);

            expect(query.sort).toHaveBeenCalledWith({
                createdAt: -1,
            });
            expect(query.skip).toHaveBeenCalledWith(0);
            expect(query.limit).toHaveBeenCalledWith(20);
            expect(result.pagination.totalItems).toBe(0);
            expect(result.pagination.totalPages).toBe(0);
        });

        it("rejects an invalid user ID", async () => {
            await expect(
                getWardrobeItems("invalid-user-id"),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 400,
            });

            expect(mocks.find).not.toHaveBeenCalled();
        });
    });

    describe("getWardrobeItemById", () => {
        it("returns an item belonging to the specified user", async () => {
            mocks.findOne.mockReturnValue(
                createQuery(databaseItem),
            );

            const result = await getWardrobeItemById(
                USER_ID,
                ITEM_ID,
            );

            expect(result.id).toBe(ITEM_ID);
            expect(result.name).toBe("Blue T-shirt");

            expect(mocks.findOne).toHaveBeenCalledWith({
                _id: expect.anything(),
                userId: expect.anything(),
            });
        });

        it("rejects an invalid item ID", async () => {
            await expect(
                getWardrobeItemById(USER_ID, "invalid-item-id"),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 400,
            });
        });

        it("returns 404 when the item does not exist for that user", async () => {
            mocks.findOne.mockReturnValue(createQuery(null));

            await expect(
                getWardrobeItemById(USER_ID, ITEM_ID),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 404,
            });
        });
    });

    describe("updateWardrobeItem", () => {
        it("updates an item with the specified fields", async () => {
            const updatedItem = {
                ...databaseItem,
                name: "Updated T-shirt",
            };

            mocks.findOneAndUpdate.mockReturnValue(
                createQuery(updatedItem),
            );

            const result = await updateWardrobeItem(
                USER_ID,
                ITEM_ID,
                { name: "Updated T-shirt" },
            );

            expect(result.name).toBe("Updated T-shirt");

            expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    _id: expect.anything(),
                    userId: expect.anything(),
                }),
                { $set: { name: "Updated T-shirt" } },
                { new: true, runValidators: true },
            );
        });

        it("rejects an empty update", async () => {
            await expect(
                updateWardrobeItem(USER_ID, ITEM_ID, {}),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 400,
            });

            expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it("returns 404 when the item cannot be found", async () => {
            mocks.findOneAndUpdate.mockReturnValue(
                createQuery(null),
            );

            await expect(
                updateWardrobeItem(USER_ID, ITEM_ID, {
                    name: "Updated T-shirt",
                }),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 404,
            });
        });
    });

    describe("deleteWardrobeItem", () => {
        it("deletes an item belonging to the specified user", async () => {
            mocks.findOneAndDelete.mockReturnValue(
                createQuery(databaseItem),
            );

            await expect(
                deleteWardrobeItem(USER_ID, ITEM_ID),
            ).resolves.toBeUndefined();

            expect(mocks.findOneAndDelete).toHaveBeenCalledWith({
                _id: expect.anything(),
                userId: expect.anything(),
            });
        });

        it("rejects an invalid item ID", async () => {
            await expect(
                deleteWardrobeItem(USER_ID, "invalid-item-id"),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 400,
            });
        });

        it("returns 404 when the item does not exist", async () => {
            mocks.findOneAndDelete.mockReturnValue(
                createQuery(null),
            );

            await expect(
                deleteWardrobeItem(USER_ID, ITEM_ID),
            ).rejects.toMatchObject({
                name: "WardrobeServiceError",
                statusCode: 404,
            });
        });
    });

    it("exposes WardrobeServiceError with its status code", () => {
        const error = new WardrobeServiceError(
            "Wardrobe item not found.",
            404,
        );

        expect(error.message).toBe("Wardrobe item not found.");
        expect(error.statusCode).toBe(404);
    });
});