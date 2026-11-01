"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherServiceError = void 0;
exports.generateClothingAdvice = generateClothingAdvice;
exports.fetchWeatherByCity = fetchWeatherByCity;
exports.fetchWeatherByCoordinates = fetchWeatherByCoordinates;
const mongoose_1 = __importDefault(require("mongoose"));
const WeatherSnapshot_1 = __importDefault(require("../../models/WeatherSnapshot"));
const weather_client_1 = require("../../integrations/weather/weather.client");
class WeatherServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "WeatherServiceError";
    }
}
exports.WeatherServiceError = WeatherServiceError;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
function generateClothingAdvice(tempC, condition, isRaining) {
    const tips = [];
    let layering = "Single layer";
    const recommendedCategories = [];
    const recommendedMaterials = [];
    if (tempC < 5) {
        layering = "Heavy layering: thermal base + warm mid-layer + heavy coat";
        recommendedCategories.push("outerwear", "sweaters", "boots", "accessories");
        recommendedMaterials.push("wool", "cashmere", "down", "fleece");
        tips.push("Wear insulated footwear and keep head/hands covered with a beanie and gloves.");
    }
    else if (tempC < 15) {
        layering = "Moderate layering: shirt + sweater or light jacket";
        recommendedCategories.push("outerwear", "tops", "bottoms", "shoes");
        recommendedMaterials.push("cotton", "denim", "knitwear", "leather");
        tips.push("A trench coat, denim jacket, or leather jacket works great.");
    }
    else if (tempC < 24) {
        layering = "Light comfortable layer";
        recommendedCategories.push("tops", "bottoms", "dresses", "shoes");
        recommendedMaterials.push("cotton", "linen", "chambray");
        tips.push("Pleasant temperature: great for light shirts, chinos, or casual dresses.");
    }
    else {
        layering = "Minimal breathable clothing";
        recommendedCategories.push("tops", "shorts", "dresses", "sandals");
        recommendedMaterials.push("linen", "lightweight cotton", "silk");
        tips.push("Stay cool with breathable fabrics, light colors, and UV protection.");
    }
    if (isRaining || condition.toLowerCase().includes("rain")) {
        tips.push("Rain expected: bring an umbrella or wear a waterproof hooded jacket and water-resistant shoes.");
    }
    return {
        layering,
        recommendedCategories,
        recommendedMaterials,
        tips,
    };
}
async function fetchWeatherByCity(userId, city = "London", country) {
    const normalizedCity = city.trim();
    // Check cached snapshot
    const cached = await WeatherSnapshot_1.default.findOne({
        city: new RegExp(`^${normalizedCity}$`, "i"),
        recordedAt: { $gte: new Date(Date.now() - CACHE_TTL_MS) },
    })
        .sort({ recordedAt: -1 })
        .lean()
        .exec();
    if (cached) {
        const isRaining = cached.condition === "rainy" || Boolean(cached.description?.toLowerCase().includes("rain"));
        return {
            city: cached.city,
            country: cached.country,
            temperatureCelsius: cached.temperatureCelsius,
            feelsLikeCelsius: cached.feelsLikeCelsius,
            humidity: cached.humidity,
            condition: cached.condition,
            description: cached.description,
            isRaining,
            recordedAt: cached.recordedAt,
            clothingAdvice: generateClothingAdvice(cached.temperatureCelsius, cached.condition, isRaining),
        };
    }
    let weather;
    try {
        weather = await (0, weather_client_1.getCurrentWeather)(normalizedCity);
    }
    catch (error) {
        if (error instanceof weather_client_1.WeatherClientError) {
            throw new WeatherServiceError(error.message, error.statusCode);
        }
        throw new WeatherServiceError("Failed to fetch weather data.", 502);
    }
    let normalizedCondition = "cloudy";
    const condLower = weather.condition.toLowerCase();
    if (condLower.includes("clear") || condLower.includes("sun"))
        normalizedCondition = "sunny";
    else if (weather.isRaining || condLower.includes("rain"))
        normalizedCondition = "rainy";
    else if (condLower.includes("snow"))
        normalizedCondition = "snowy";
    else if (condLower.includes("wind"))
        normalizedCondition = "windy";
    else if (condLower.includes("fog") || condLower.includes("mist"))
        normalizedCondition = "foggy";
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    await WeatherSnapshot_1.default.create({
        userId: userId && mongoose_1.default.isValidObjectId(userId) ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
        city: weather.location,
        country: weather.country,
        temperatureCelsius: Math.round(weather.temperatureCelsius),
        feelsLikeCelsius: Math.round(weather.feelsLikeCelsius),
        humidity: weather.humidity,
        windSpeedKmh: Math.round(weather.windSpeedMetersPerSecond * 3.6),
        condition: normalizedCondition,
        description: weather.description,
        recordedAt: weather.observedAt,
        expiresAt,
    });
    return {
        city: weather.location,
        country: weather.country,
        temperatureCelsius: weather.temperatureCelsius,
        feelsLikeCelsius: weather.feelsLikeCelsius,
        humidity: weather.humidity,
        condition: normalizedCondition,
        description: weather.description,
        isRaining: weather.isRaining,
        recordedAt: weather.observedAt,
        clothingAdvice: generateClothingAdvice(weather.temperatureCelsius, weather.condition, weather.isRaining),
    };
}
async function fetchWeatherByCoordinates(userId, latitude = 0, longitude = 0) {
    try {
        const weather = await (0, weather_client_1.getWeatherForCoordinates)(latitude, longitude);
        let normalizedCondition = "cloudy";
        const condLower = weather.condition.toLowerCase();
        if (condLower.includes("clear") || condLower.includes("sun"))
            normalizedCondition = "sunny";
        else if (condLower.includes("rain"))
            normalizedCondition = "rainy";
        const isRaining = condLower.includes("rain");
        return {
            city: weather.location,
            temperatureCelsius: weather.temperatureC,
            condition: normalizedCondition,
            humidity: weather.humidity,
            description: weather.description,
            isRaining,
            recordedAt: new Date(),
            clothingAdvice: generateClothingAdvice(weather.temperatureC, weather.condition, isRaining),
        };
    }
    catch (error) {
        if (error instanceof weather_client_1.WeatherClientError) {
            throw new WeatherServiceError(error.message, error.statusCode);
        }
        throw new WeatherServiceError("Failed to fetch coordinates weather.", 502);
    }
}
