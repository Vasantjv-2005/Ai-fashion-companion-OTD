
import type {
    ClothingRecognitionRequest,
    ClothingRecognitionResponse,
} from "./ai.types";

export class AiServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 502,
    ) {
        super(message);
        this.name = "AiServiceError";
    }
}

const DEFAULT_TIMEOUT_MS = 15_000;

function getAiServiceUrl(): string {
    const url = process.env.AI_SERVICE_URL?.trim();

    if (!url) {
        throw new AiServiceError(
            "AI_SERVICE_URL is not configured.",
            503,
        );
    }

    return url.replace(/\/+$/, "");
}

function isValidRecognitionResponse(
    data: unknown,
): data is ClothingRecognitionResponse {
    if (typeof data !== "object" || data === null) {
        return false;
    }

    const result = data as Record<string, unknown>;

    if (!Array.isArray(result.predictions)) {
        return false;
    }

    return result.predictions.every((item: unknown) => {
        if (typeof item !== "object" || item === null) {
            return false;
        }

        const prediction = item as Record<string, unknown>;

        return (
            typeof prediction.category === "string" &&
            typeof prediction.confidence === "number" &&
            Number.isFinite(prediction.confidence) &&
            prediction.confidence >= 0 &&
            prediction.confidence <= 1
        );
    });
}

export async function recognizeClothing(
    input: ClothingRecognitionRequest,
): Promise<ClothingRecognitionResponse> {
    const baseUrl = getAiServiceUrl();

    if (!input.imageUrl && !input.imageBase64) {
        throw new AiServiceError(
            "Provide an imageUrl or imageBase64.",
            400,
        );
    }

    const timeoutMs = Number(
        process.env.AI_SERVICE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
    );

    const controller = new AbortController();
    const timeout = setTimeout(
        () => controller.abort(),
        Number.isFinite(timeoutMs) && timeoutMs > 0
            ? timeoutMs
            : DEFAULT_TIMEOUT_MS,
    );

    try {
        const response = await fetch(
            `${baseUrl}/recognize-clothing`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify(input),
                signal: controller.signal,
            },
        );

        if (!response.ok) {
            throw new AiServiceError(
                `AI service returned HTTP ${response.status}.`,
                502,
            );
        }

        let data: unknown;

        try {
            data = await response.json();
        } catch {
            throw new AiServiceError(
                "AI service returned invalid JSON.",
            );
        }

        if (!isValidRecognitionResponse(data)) {
            throw new AiServiceError(
                "AI service response does not match the expected format.",
            );
        }

        return data;
    } catch (error) {
        if (error instanceof AiServiceError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new AiServiceError(
                "AI service request timed out.",
                504,
            );
        }

        throw new AiServiceError(
            "Unable to connect to the AI service.",
            502,
        );
    } finally {
        clearTimeout(timeout);
    }
}
