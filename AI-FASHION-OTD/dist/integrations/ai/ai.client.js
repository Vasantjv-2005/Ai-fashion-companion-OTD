"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClientError = void 0;
exports.aiRequest = aiRequest;
const env_1 = require("../../config/env");
class AIClientError extends Error {
    statusCode;
    constructor(message, statusCode = 502) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AIClientError";
    }
}
exports.AIClientError = AIClientError;
function getAIServiceURL() {
    const serviceURL = env_1.env.AI_SERVICE_URL;
    if (!serviceURL) {
        throw new AIClientError("AI_SERVICE_URL is not configured.", 503);
    }
    return serviceURL.replace(/\/+$/, "");
}
async function aiRequest(endpoint, payload, options = {}) {
    if (!endpoint.trim()) {
        throw new AIClientError("AI endpoint is required.", 400);
    }
    const normalizedEndpoint = endpoint.replace(/^\/+/, "");
    if (normalizedEndpoint.split("/").includes("..")) {
        throw new AIClientError("Invalid AI endpoint.", 400);
    }
    const baseURL = getAIServiceURL();
    const timeoutMs = options.timeoutMs ?? env_1.env.AI_SERVICE_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(`${baseURL}/${normalizedEndpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                ...options.headers,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new AIClientError(`AI service returned HTTP ${response.status}.`, 502);
        }
        try {
            return (await response.json());
        }
        catch {
            throw new AIClientError("AI service returned an invalid JSON response.", 502);
        }
    }
    catch (error) {
        if (error instanceof AIClientError) {
            throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new AIClientError("AI service request timed out.", 504);
        }
        throw new AIClientError("Unable to connect to the AI service.", 503);
    }
    finally {
        clearTimeout(timeout);
    }
}
