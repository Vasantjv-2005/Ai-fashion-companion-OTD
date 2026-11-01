import type { Request, Response, NextFunction } from "express";
import {
    fetchWeatherByCity,
    fetchWeatherByCoordinates,
    WeatherServiceError,
} from "./weather.service";
import { validateWeatherQuery } from "./weather.validator";

function getUserId(req: Request): string | undefined {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? undefined;
}

function handleWeatherError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof WeatherServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function getWeatherController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    const validation = validateWeatherQuery(req.query);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid weather query parameters.",
            errors: validation.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
        return;
    }

    try {
        let weatherData;
        if ("lat" in validation.data && "lon" in validation.data) {
            weatherData = await fetchWeatherByCoordinates(
                userId,
                validation.data.lat,
                validation.data.lon,
            );
        } else if ("city" in validation.data) {
            weatherData = await fetchWeatherByCity(
                userId,
                validation.data.city,
                validation.data.country,
            );
        }

        res.status(200).json({
            success: true,
            data: weatherData,
        });
    } catch (error) {
        handleWeatherError(error, res, next);
    }
}

