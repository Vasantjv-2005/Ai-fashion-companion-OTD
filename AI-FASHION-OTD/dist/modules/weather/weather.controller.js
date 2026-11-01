"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeatherController = getWeatherController;
const weather_service_1 = require("./weather.service");
const weather_validator_1 = require("./weather.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? undefined;
}
function handleWeatherError(error, res, next) {
    if (error instanceof weather_service_1.WeatherServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getWeatherController(req, res, next) {
    const userId = getUserId(req);
    const validation = (0, weather_validator_1.validateWeatherQuery)(req.query);
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
            weatherData = await (0, weather_service_1.fetchWeatherByCoordinates)(userId, validation.data.lat, validation.data.lon);
        }
        else if ("city" in validation.data) {
            weatherData = await (0, weather_service_1.fetchWeatherByCity)(userId, validation.data.city, validation.data.country);
        }
        res.status(200).json({
            success: true,
            data: weatherData,
        });
    }
    catch (error) {
        handleWeatherError(error, res, next);
    }
}
