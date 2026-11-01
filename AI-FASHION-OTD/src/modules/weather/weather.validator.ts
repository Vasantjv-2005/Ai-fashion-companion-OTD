import { z } from "zod";

export const weatherCityQuerySchema = z.object({
    city: z.string().trim().min(2, "City name must contain at least 2 characters.").max(150),
    country: z.string().trim().max(100).optional(),
});

export const weatherCoordinatesQuerySchema = z.object({
    lat: z.coerce.number().min(-90).max(90),
    lon: z.coerce.number().min(-180).max(180),
});

export const weatherQuerySchema = z.union([
    weatherCityQuerySchema,
    weatherCoordinatesQuerySchema,
]);

export function validateWeatherQuery(data: unknown) {
    if (typeof data === "object" && data !== null && ("lat" in data || "lon" in data)) {
        return weatherCoordinatesQuerySchema.safeParse(data);
    }
    return weatherCityQuerySchema.safeParse(data);
}

