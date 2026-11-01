import type { WEATHER_CONDITIONS } from "../../models/WeatherSnapshot";

export interface WeatherResponseData {
    city: string;
    country?: string;
    temperatureCelsius: number;
    feelsLikeCelsius?: number;
    humidity?: number;
    condition: (typeof WEATHER_CONDITIONS)[number];
    description?: string;
    isRaining: boolean;
    recordedAt: Date;
    clothingAdvice: {
        layering: string;
        recommendedCategories: string[];
        recommendedMaterials: string[];
        tips: string[];
    };
}

export interface CoordinatesWeatherQuery {
    latitude: number;
    longitude: number;
}

export interface CityWeatherQuery {
    city: string;
    country?: string;
}

