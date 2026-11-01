import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    snapshotFindOne: vi.fn(),
    snapshotCreate: vi.fn(),
    getCurrentWeather: vi.fn(),
    getWeatherForCoordinates: vi.fn(),
}));

vi.mock("../../src/models/WeatherSnapshot", () => ({
    default: {
        findOne: mocks.snapshotFindOne,
        create: mocks.snapshotCreate,
    },
}));

vi.mock("../../src/integrations/weather/weather.client", () => ({
    getCurrentWeather: mocks.getCurrentWeather,
    getWeatherForCoordinates: mocks.getWeatherForCoordinates,
    WeatherClientError: class WeatherClientError extends Error {
        constructor(
            message: string,
            public readonly statusCode: number = 502,
        ) {
            super(message);
            this.name = "WeatherClientError";
        }
    },
}));

import {
    generateClothingAdvice,
    fetchWeatherByCity,
    fetchWeatherByCoordinates,
    WeatherServiceError,
} from "../../src/modules/weather/weather.service";

describe("Weather service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("generateClothingAdvice", () => {
        it("should recommend heavy layering for freezing temps (<5C)", () => {
            const advice = generateClothingAdvice(2, "clear", false);
            expect(advice.layering).toContain("Heavy layering");
            expect(advice.recommendedCategories).toContain("outerwear");
            expect(advice.recommendedMaterials).toContain("wool");
        });

        it("should recommend moderate layering for cool temps (5-14C)", () => {
            const advice = generateClothingAdvice(12, "cloudy", false);
            expect(advice.layering).toContain("Moderate layering");
            expect(advice.recommendedCategories).toContain("outerwear");
        });

        it("should recommend breathable clothing and sun protection for warm temps (>24C)", () => {
            const advice = generateClothingAdvice(28, "sunny", false);
            expect(advice.layering).toContain("Minimal breathable");
            expect(advice.recommendedMaterials).toContain("linen");
        });

        it("should add rain tip when raining", () => {
            const advice = generateClothingAdvice(18, "rainy", true);
            expect(advice.tips.some((tip) => tip.includes("Rain expected"))).toBe(true);
        });
    });

    describe("fetchWeatherByCity", () => {
        it("should return cached snapshot when fresh cache exists", async () => {
            const cachedSnapshot = {
                city: "London",
                country: "GB",
                temperatureCelsius: 16,
                feelsLikeCelsius: 15,
                humidity: 70,
                condition: "cloudy",
                description: "Overcast clouds",
                recordedAt: new Date(),
            };

            mocks.snapshotFindOne.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue(cachedSnapshot),
                    }),
                }),
            });

            const result = await fetchWeatherByCity(undefined, "London");
            expect(result.city).toBe("London");
            expect(result.temperatureCelsius).toBe(16);
            expect(mocks.getCurrentWeather).not.toHaveBeenCalled();
        });

        it("should call weather client and persist snapshot on cache miss", async () => {
            mocks.snapshotFindOne.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue(null),
                    }),
                }),
            });

            const liveWeather = {
                location: "Tokyo",
                country: "JP",
                temperatureCelsius: 20,
                feelsLikeCelsius: 19,
                humidity: 60,
                windSpeedMetersPerSecond: 3.5,
                condition: "clear sky",
                description: "Clear and sunny",
                isRaining: false,
                observedAt: new Date(),
            };

            mocks.getCurrentWeather.mockResolvedValue(liveWeather);
            mocks.snapshotCreate.mockResolvedValue({});

            const result = await fetchWeatherByCity(undefined, "Tokyo");
            expect(result.city).toBe("Tokyo");
            expect(result.condition).toBe("sunny");
            expect(mocks.snapshotCreate).toHaveBeenCalled();
        });
    });

    describe("fetchWeatherByCoordinates", () => {
        it("should fetch weather for valid coordinates and return clothing advice", async () => {
            mocks.getWeatherForCoordinates.mockResolvedValue({
                location: "Paris",
                temperatureC: 14,
                humidity: 65,
                condition: "light rain",
                description: "Light rain showers",
            });

            const result = await fetchWeatherByCoordinates(undefined, 48.8566, 2.3522);
            expect(result.city).toBe("Paris");
            expect(result.condition).toBe("rainy");
            expect(result.isRaining).toBe(true);
        });
    });
});

