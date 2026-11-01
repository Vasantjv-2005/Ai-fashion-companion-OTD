import mongoose from "mongoose";
import WeatherSnapshot from "../../models/WeatherSnapshot";
import {
    getCurrentWeather,
    getWeatherForCoordinates,
    WeatherClientError,
    type WeatherData,
} from "../../integrations/weather/weather.client";
import type { WeatherResponseData } from "./weather.types";

export class WeatherServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "WeatherServiceError";
    }
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function generateClothingAdvice(
    tempC: number,
    condition: string,
    isRaining: boolean,
): WeatherResponseData["clothingAdvice"] {
    const tips: string[] = [];
    let layering = "Single layer";
    const recommendedCategories: string[] = [];
    const recommendedMaterials: string[] = [];

    if (tempC < 5) {
        layering = "Heavy layering: thermal base + warm mid-layer + heavy coat";
        recommendedCategories.push("outerwear", "sweaters", "boots", "accessories");
        recommendedMaterials.push("wool", "cashmere", "down", "fleece");
        tips.push("Wear insulated footwear and keep head/hands covered with a beanie and gloves.");
    } else if (tempC < 15) {
        layering = "Moderate layering: shirt + sweater or light jacket";
        recommendedCategories.push("outerwear", "tops", "bottoms", "shoes");
        recommendedMaterials.push("cotton", "denim", "knitwear", "leather");
        tips.push("A trench coat, denim jacket, or leather jacket works great.");
    } else if (tempC < 24) {
        layering = "Light comfortable layer";
        recommendedCategories.push("tops", "bottoms", "dresses", "shoes");
        recommendedMaterials.push("cotton", "linen", "chambray");
        tips.push("Pleasant temperature: great for light shirts, chinos, or casual dresses.");
    } else {
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

export async function fetchWeatherByCity(
    userId?: string,
    city = "London",
    country?: string,
): Promise<WeatherResponseData> {
    const normalizedCity = city.trim();

    // Check cached snapshot
    const cached = await WeatherSnapshot.findOne({
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
            clothingAdvice: generateClothingAdvice(
                cached.temperatureCelsius,
                cached.condition,
                isRaining,
            ),
        };
    }

    let weather: WeatherData;
    try {
        weather = await getCurrentWeather(normalizedCity);
    } catch (error: unknown) {
        if (error instanceof WeatherClientError) {
            throw new WeatherServiceError(error.message, error.statusCode);
        }
        throw new WeatherServiceError("Failed to fetch weather data.", 502);
    }

    let normalizedCondition: any = "cloudy";
    const condLower = weather.condition.toLowerCase();
    if (condLower.includes("clear") || condLower.includes("sun")) normalizedCondition = "sunny";
    else if (weather.isRaining || condLower.includes("rain")) normalizedCondition = "rainy";
    else if (condLower.includes("snow")) normalizedCondition = "snowy";
    else if (condLower.includes("wind")) normalizedCondition = "windy";
    else if (condLower.includes("fog") || condLower.includes("mist")) normalizedCondition = "foggy";

    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

    await WeatherSnapshot.create({
        userId: userId && mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : undefined,
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
        clothingAdvice: generateClothingAdvice(
            weather.temperatureCelsius,
            weather.condition,
            weather.isRaining,
        ),
    };
}

export async function fetchWeatherByCoordinates(
    userId?: string,
    latitude = 0,
    longitude = 0,
): Promise<WeatherResponseData> {
    try {
        const weather = await getWeatherForCoordinates(latitude, longitude);

        let normalizedCondition: any = "cloudy";
        const condLower = weather.condition.toLowerCase();
        if (condLower.includes("clear") || condLower.includes("sun")) normalizedCondition = "sunny";
        else if (condLower.includes("rain")) normalizedCondition = "rainy";

        const isRaining = condLower.includes("rain");

        return {
            city: weather.location,
            temperatureCelsius: weather.temperatureC,
            condition: normalizedCondition,
            humidity: weather.humidity,
            description: weather.description,
            isRaining,
            recordedAt: new Date(),
            clothingAdvice: generateClothingAdvice(
                weather.temperatureC,
                weather.condition,
                isRaining,
            ),
        };
    } catch (error: unknown) {
        if (error instanceof WeatherClientError) {
            throw new WeatherServiceError(error.message, error.statusCode);
        }
        throw new WeatherServiceError("Failed to fetch coordinates weather.", 502);
    }
}

