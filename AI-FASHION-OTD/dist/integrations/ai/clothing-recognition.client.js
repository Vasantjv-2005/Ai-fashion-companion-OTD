"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiServiceError = void 0;
exports.recognizeClothing = recognizeClothing;
class AiServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 502) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AiServiceError";
    }
}
exports.AiServiceError = AiServiceError;
const DEFAULT_TIMEOUT_MS = 15_000;
function getAiServiceUrl() {
    const url = process.env.AI_SERVICE_URL?.trim();
    if (!url) {
        throw new AiServiceError("AI_SERVICE_URL is not configured.", 503);
    }
    return url.replace(/\/+$/, "");
}
function isValidRecognitionResponse(data) {
    if (typeof data !== "object" || data === null) {
        return false;
    }
    const result = data;
    if (!Array.isArray(result.predictions)) {
        return false;
    }
    return result.predictions.every((item) => {
        if (typeof item !== "object" || item === null) {
            return false;
        }
        const prediction = item;
        return (typeof prediction.category === "string" &&
            typeof prediction.confidence === "number" &&
            Number.isFinite(prediction.confidence) &&
            prediction.confidence >= 0 &&
            prediction.confidence <= 1);
    });
}
async function recognizeClothing(input) {
    const baseUrl = getAiServiceUrl();
    if (!input.imageUrl && !input.imageBase64) {
        throw new AiServiceError("Provide an imageUrl or imageBase64.", 400);
    }
    const timeoutMs = Number(process.env.AI_SERVICE_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0
        ? timeoutMs
        : DEFAULT_TIMEOUT_MS);
    try {
        const response = await fetch(`${baseUrl}/recognize-clothing`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(input),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new AiServiceError(`AI service returned HTTP ${response.status}.`, 502);
        }
        let data;
        try {
            data = await response.json();
        }
        catch {
            throw new AiServiceError("AI service returned invalid JSON.");
        }
        if (!isValidRecognitionResponse(data)) {
            throw new AiServiceError("AI service response does not match the expected format.");
        }
        return data;
    }
    catch (error) {
        if (error instanceof AiServiceError) {
            throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new AiServiceError("AI service request timed out.", 504);
        }
        throw new AiServiceError("Unable to connect to the AI service.", 502);
    }
    finally {
        clearTimeout(timeout);
    }
}
