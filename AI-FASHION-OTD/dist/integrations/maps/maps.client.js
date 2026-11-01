"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsClientError = void 0;
exports.geocodeLocation = geocodeLocation;
const env_1 = require("../../config/env");
class MapsClientError extends Error {
    statusCode;
    constructor(message, statusCode = 502) {
        super(message);
        this.statusCode = statusCode;
        this.name = "MapsClientError";
    }
}
exports.MapsClientError = MapsClientError;
function getMapsApiKey() {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey?.trim()) {
        throw new MapsClientError("GOOGLE_MAPS_API_KEY is not configured.", 503);
    }
    return apiKey.trim();
}
function getMapsTimeout() {
    return env_1.env.AI_SERVICE_TIMEOUT_MS;
}
/**
 * Converts a human-readable address or city into geographic coordinates.
 */
async function geocodeLocation(address) {
    const query = address.trim();
    if (query.length < 2 || query.length > 250) {
        throw new MapsClientError("Location must contain between 2 and 250 characters.", 400);
    }
    const apiKey = getMapsApiKey();
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query);
    url.searchParams.set("key", apiKey);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getMapsTimeout());
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new MapsClientError("The maps provider returned an unsuccessful response.", 502);
        }
        const data = (await response.json());
        if (data.status === "ZERO_RESULTS") {
            throw new MapsClientError("No matching location was found.", 404);
        }
        if (data.status !== "OK" || !data.results?.length) {
            throw new MapsClientError("Unable to resolve this location.", 502);
        }
        const result = data.results[0];
        if (!result?.geometry?.location ||
            !Number.isFinite(result.geometry.location.lat) ||
            !Number.isFinite(result.geometry.location.lng)) {
            throw new MapsClientError("The maps provider returned invalid coordinates.", 502);
        }
        return {
            formattedAddress: result.formatted_address,
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng,
            placeId: result.place_id,
        };
    }
    catch (error) {
        if (error instanceof MapsClientError) {
            throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new MapsClientError("The maps request timed out.", 504);
        }
        throw new MapsClientError("Unable to connect to the maps provider.", 503);
    }
    finally {
        clearTimeout(timeout);
    }
}
