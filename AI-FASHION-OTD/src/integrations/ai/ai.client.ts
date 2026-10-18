
import { env } from "../../config/env";

export class AIClientError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 502,
    ) {
        super(message);
        this.name = "AIClientError";
    }
}

interface AIRequestOptions {
    timeoutMs?: number;
    headers?: Record<string, string>;
}

function getAIServiceURL(): string {
    const serviceURL = env.AI_SERVICE_URL;

    if (!serviceURL) {
        throw new AIClientError(
            "AI_SERVICE_URL is not configured.",
            503,
        );
    }

    return serviceURL.replace(/\/+$/, "");
}

export async function aiRequest<TResponse>(
    endpoint: string,
    payload: unknown,
    options: AIRequestOptions = {},
): Promise<TResponse> {
    if (!endpoint.trim()) {
        throw new AIClientError("AI endpoint is required.", 400);
    }

    const normalizedEndpoint = endpoint.replace(/^\/+/, "");

    if (normalizedEndpoint.split("/").includes("..")) {
        throw new AIClientError("Invalid AI endpoint.", 400);
    }

    const baseURL = getAIServiceURL();
    const timeoutMs = options.timeoutMs ?? env.AI_SERVICE_TIMEOUT_MS;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(
            `${baseURL}/${normalizedEndpoint}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...options.headers,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            },
        );

        if (!response.ok) {
            throw new AIClientError(
                `AI service returned HTTP ${response.status}.`,
                502,
            );
        }

        try {
            return (await response.json()) as TResponse;
        } catch {
            throw new AIClientError(
                "AI service returned an invalid JSON response.",
                502,
            );
        }
    } catch (error: unknown) {
        if (error instanceof AIClientError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new AIClientError("AI service request timed out.", 504);
        }

        throw new AIClientError(
            "Unable to connect to the AI service.",
            503,
        );
    } finally {
        clearTimeout(timeout);
    }
}
