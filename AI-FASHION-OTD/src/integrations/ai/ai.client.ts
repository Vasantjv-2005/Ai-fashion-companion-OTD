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

interface AIImageFile {
    buffer: Uint8Array;
    filename: string;
    mimeType: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
};

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

function normalizeEndpoint(endpoint: string): string {
    if (!endpoint.trim()) {
        throw new AIClientError("AI endpoint is required.", 400);
    }

    const normalizedEndpoint = endpoint.replace(/^\/+/, "");

    if (normalizedEndpoint.split("/").includes("..")) {
        throw new AIClientError("Invalid AI endpoint.", 400);
    }

    return normalizedEndpoint;
}

export async function aiRequest<TResponse>(
    endpoint: string,
    payload: unknown,
    options: AIRequestOptions = {},
): Promise<TResponse> {
    const normalizedEndpoint = normalizeEndpoint(endpoint);
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

export async function aiUploadFile(
    endpoint: string,
    file: AIImageFile,
    options: AIRequestOptions = {},
): Promise<unknown> {
    const normalizedEndpoint = normalizeEndpoint(endpoint);

    if (!file.buffer.byteLength) {
        throw new AIClientError("Image file is empty.", 400);
    }

    if (file.buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new AIClientError(
            "Image exceeds the 10 MiB limit.",
            413,
        );
    }

    const dotIndex = file.filename.lastIndexOf(".");
    const extension =
        dotIndex >= 0 ? file.filename.slice(dotIndex).toLowerCase() : "";

    if (!ALLOWED_IMAGE_TYPES[file.mimeType]?.includes(extension)) {
        throw new AIClientError("Unsupported image type.", 400);
    }

    const form = new FormData();
    form.append(
        "file",
        new Blob([Uint8Array.from(file.buffer)], {
            type: file.mimeType,
        }),
        file.filename,
    );

    const baseURL = getAIServiceURL();
    const timeoutMs = options.timeoutMs ?? env.AI_SERVICE_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const headers = {
        Accept: "application/json",
        ...options.headers,
    };
    delete headers["Content-Type"];
    delete headers["content-type"];

    try {
        const response = await fetch(
            `${baseURL}/${normalizedEndpoint}`,
            {
                method: "POST",
                headers,
                body: form,
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
            const result: unknown = await response.json();
            return result;
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
