"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherClientError = void 0;
exports.getCurrentWeather = getCurrentWeather;
exports.getWeatherForCoordinates = getWeatherForCoordinates;
const env_1 = require("../../config/env");
class WeatherClientError extends Error {
    statusCode;
    constructor(message, statusCode = 502) {
        super(message);
        this.statusCode = statusCode;
        this.name = "WeatherClientError";
    }
}
exports.WeatherClientError = WeatherClientError;
function getWeatherApiKey() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey?.trim()) {
        throw new WeatherClientError("OPENWEATHER_API_KEY is not configured.", 503);
    }
    return apiKey.trim();
}
/**
 * Fetches current weather for a city or location.
 */
async function getCurrentWeather(location) {
    const query = location.trim();
    if (query.length < 2 || query.length > 150) {
        throw new WeatherClientError("Location must contain between 2 and 150 characters.", 400);
    }
    const apiKey = getWeatherApiKey();
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", query);
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env_1.env.AI_SERVICE_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });
        if (response.status === 404) {
            throw new WeatherClientError("Weather data was not found for this location.", 404);
        }
        if (response.status === 401) {
            throw new WeatherClientError("The weather API key is invalid.", 503);
        }
        if (!response.ok) {
            throw new WeatherClientError("The weather provider returned an unsuccessful response.", 502);
        }
        const data = (await response.json());
        const currentCondition = data.weather?.[0];
        if (!data.name ||
            !data.main ||
            !currentCondition ||
            !Number.isFinite(data.main.temp) ||
            !Number.isFinite(data.main.feels_like) ||
            !Number.isFinite(data.main.humidity)) {
            throw new WeatherClientError("The weather provider returned invalid data.", 502);
        }
        const condition = currentCondition.main;
        const description = currentCondition.description;
        return {
            location: data.name,
            country: data.sys?.country,
            temperatureCelsius: data.main.temp,
            feelsLikeCelsius: data.main.feels_like,
            humidity: data.main.humidity,
            condition,
            description,
            windSpeedMetersPerSecond: data.wind?.speed ?? 0,
            isRaining: condition.toLowerCase() === "rain" ||
                condition.toLowerCase() === "drizzle" ||
                Boolean(data.rain),
            observedAt: new Date(data.dt * 1000),
        };
    }
    catch (error) {
        if (error instanceof WeatherClientError) {
            throw error;
        }
        if (error instanceof Error && error.name === "AbortError") {
            throw new WeatherClientError("The weather request timed out.", 504);
        }
        throw new WeatherClientError("Unable to connect to the weather provider.", 503);
    }
    finally {
        clearTimeout(timeout);
    }
}
/**
 * Fetches current weather for geographic coordinates.
 */
async function getWeatherForCoordinates(latitude, longitude) {
    const apiKey = getWeatherApiKey();
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("appid", apiKey);
    url.searchParams.set("units", "metric");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env_1.env.AI_SERVICE_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal,
        });
        if (!response.ok) {
            throw new WeatherClientError("Unable to fetch weather data for coordinates.", 502);
        }
        const data = (await response.json());
        const currentCondition = data.weather?.[0];
        return {
            location: data.name || "Unknown",
            temperatureC: data.main?.temp ?? 20,
            condition: currentCondition?.main || "Clear",
            humidity: data.main?.humidity ?? 50,
            description: currentCondition?.description || "Clear sky",
        };
    }
    catch (error) {
        if (error instanceof WeatherClientError)
            throw error;
        if (error instanceof Error && error.name === "AbortError") {
            throw new WeatherClientError("The weather request timed out.", 504);
        }
        throw new WeatherClientError("Unable to connect to the weather provider.", 503);
    }
    finally {
        clearTimeout(timeout);
    }
}
