import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    createWardrobeItem: vi.fn(),
    getWardrobeItems: vi.fn(),
    getWardrobeItemById: vi.fn(),
    updateWardrobeItem: vi.fn(),
    deleteWardrobeItem: vi.fn(),
}));

vi.mock("../../src/modules/wardrobe/wardrobe.service", () => ({
    createWardrobeItem: mocks.createWardrobeItem,
    getWardrobeItems: mocks.getWardrobeItems,
    getWardrobeItemById: mocks.getWardrobeItemById,
    updateWardrobeItem: mocks.updateWardrobeItem,
    deleteWardrobeItem: mocks.deleteWardrobeItem,

    WardrobeServiceError: class WardrobeServiceError extends Error {
        constructor(
            message: string,
            public readonly statusCode: number,
        ) {
            super(message);
            this.name = "WardrobeServiceError";
        }
    },
}));

import wardrobeRoutes from "../../src/modules/wardrobe/wardrobe.routes";

const JWT_SECRET = "test-secret-with-more-than-32-characters";
const USER_ID = "507f1f77bcf86cd799439011";
const ITEM_ID = "507f1f77bcf86cd799439012";

const testItem = {
    id: ITEM_ID,
    userId: USER_ID,
    name: "Blue T-shirt",
    category: "tops",
    color: "blue",
    style: "casual",
    season: ["summer"],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const validItemInput = {
    name: "Blue T-shirt",
    category: "tops",
    color: "blue",
    style: "casual",
    season: ["summer"],
};

function createAccessToken(): string {
    return jwt.sign(
        {
            sub: USER_ID,
            email: "test@example.com",
            type: "access",
        },
        JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: "15m",
        },
    );
}

const app = express();

app.use(express.json());
app.use("/api/wardrobe", wardrobeRoutes);

describe("Wardrobe routes integration tests", () => {
    let accessToken: string;

    beforeEach(() => {
        vi.resetAllMocks();

        process.env.JWT_ACCESS_SECRET = JWT_SECRET;
        accessToken = createAccessToken();

        mocks.createWardrobeItem.mockResolvedValue(testItem);

        mocks.getWardrobeItems.mockResolvedValue({
            items: [testItem],
            pagination: {
                page: 1,
                limit: 20,
                totalItems: 1,
                totalPages: 1,
            },
        });

        mocks.getWardrobeItemById.mockResolvedValue(testItem);
        mocks.updateWardrobeItem.mockResolvedValue({
            ...testItem,
            name: "Updated T-shirt",
        });

        mocks.deleteWardrobeItem.mockResolvedValue(undefined);
    });

    describe("Authentication", () => {
        it("returns 401 when no access token is provided", async () => {
            const response = await request(app)
                .get("/api/wardrobe");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                "Authentication is required.",
            );

            expect(mocks.getWardrobeItems).not.toHaveBeenCalled();
        });

        it("returns 401 when the access token is invalid", async () => {
            const response = await request(app)
                .get("/api/wardrobe")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/wardrobe", () => {
        it("creates a wardrobe item successfully", async () => {
            const response = await request(app)
                .post("/api/wardrobe")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(validItemInput);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("Blue T-shirt");

            expect(mocks.createWardrobeItem).toHaveBeenCalledWith(
                USER_ID,
                validItemInput,
            );
        });

        it("returns 400 when required fields are missing", async () => {
            const response = await request(app)
                .post("/api/wardrobe")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    name: "Blue T-shirt",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                "Request validation failed.",
            );

            expect(mocks.createWardrobeItem).not.toHaveBeenCalled();
        });
    });

    describe("GET /api/wardrobe", () => {
        it("returns the authenticated user's wardrobe", async () => {
            const response = await request(app)
                .get("/api/wardrobe")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.data[0].id).toBe(ITEM_ID);

            expect(mocks.getWardrobeItems).toHaveBeenCalledWith(
                USER_ID,
                expect.objectContaining({
                    page: 1,
                    limit: 20,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                }),
            );
        });

        it("supports pagination query parameters", async () => {
            const response = await request(app)
                .get("/api/wardrobe?page=2&limit=5")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);

            expect(mocks.getWardrobeItems).toHaveBeenCalledWith(
                USER_ID,
                expect.objectContaining({
                    page: 2,
                    limit: 5,
                }),
            );
        });
    });

    describe("GET /api/wardrobe/:id", () => {
        it("returns a wardrobe item by ID", async () => {
            const response = await request(app)
                .get(`/api/wardrobe/${ITEM_ID}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(ITEM_ID);

            expect(mocks.getWardrobeItemById).toHaveBeenCalledWith(
                USER_ID,
                ITEM_ID,
            );
        });

        it("returns 400 for an invalid item ID", async () => {
            const response = await request(app)
                .get("/api/wardrobe/not-a-valid-id")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);

            expect(mocks.getWardrobeItemById).not.toHaveBeenCalled();
        });
    });

    describe("PATCH /api/wardrobe/:id", () => {
        it("updates a wardrobe item successfully", async () => {
            const response = await request(app)
                .patch(`/api/wardrobe/${ITEM_ID}`)
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    name: "Updated T-shirt",
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe("Updated T-shirt");

            expect(mocks.updateWardrobeItem).toHaveBeenCalledWith(
                USER_ID,
                ITEM_ID,
                {
                    name: "Updated T-shirt",
                },
            );
        });
    });

    describe("DELETE /api/wardrobe/:id", () => {
        it("deletes a wardrobe item successfully", async () => {
            const response = await request(app)
                .delete(`/api/wardrobe/${ITEM_ID}`)
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Wardrobe item deleted successfully.",
            );

            expect(mocks.deleteWardrobeItem).toHaveBeenCalledWith(
                USER_ID,
                ITEM_ID,
            );
        });
    });
});