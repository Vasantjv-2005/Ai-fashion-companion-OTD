
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";

import {
    AiServiceError,
    recognizeClothing,
} from "../../src/integrations/ai/clothing-recognition.client";

describe("Clothing recognition AI client", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it("throws an error when AI_SERVICE_URL is missing", async () => {
        vi.stubEnv("AI_SERVICE_URL", "");

        await expect(
            recognizeClothing({
                imageUrl: "https://example.com/shirt.jpg",
            }),
        ).rejects.toThrow("AI_SERVICE_URL is not configured.");
    });

    it("returns predictions for a valid response", async () => {
        vi.stubEnv("AI_SERVICE_URL", "http://localhost:8000");

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    predictions: [
                        {
                            category: "shirt",
                            color: "blue",
                            confidence: 0.94,
                        },
                    ],
                    modelVersion: "test-model-v1",
                    requestId: "test-request-001",
                }),
            }),
        );

        const result = await recognizeClothing({
            imageUrl: "https://example.com/shirt.jpg",
        });

        expect(result.predictions).toHaveLength(1);
        expect(result.predictions[0].category).toBe("shirt");
        expect(result.predictions[0].confidence).toBe(0.94);
    });

    it("rejects an invalid AI response", async () => {
        vi.stubEnv("AI_SERVICE_URL", "http://localhost:8000");

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({
                    predictions: "invalid",
                }),
            }),
        );

        await expect(
            recognizeClothing({
                imageUrl: "https://example.com/shirt.jpg",
            }),
        ).rejects.toThrow(
            "AI service response does not match the expected format.",
        );
    });

    it("handles an unavailable AI service", async () => {
        vi.stubEnv("AI_SERVICE_URL", "http://localhost:8000");

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 503,
            }),
        );

        await expect(
            recognizeClothing({
                imageUrl: "https://example.com/shirt.jpg",
            }),
        ).rejects.toMatchObject({
            name: "AiServiceError",
            statusCode: 502,
        });
    });

    it("rejects requests without an image", async () => {
        vi.stubEnv("AI_SERVICE_URL", "http://localhost:8000");

        await expect(
            recognizeClothing({}),
        ).rejects.toThrow(
            "Provide an imageUrl or imageBase64.",
        );
    });
});
