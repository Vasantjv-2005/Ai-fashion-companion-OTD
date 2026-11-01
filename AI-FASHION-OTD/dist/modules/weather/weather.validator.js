"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.weatherQuerySchema = exports.weatherCoordinatesQuerySchema = exports.weatherCityQuerySchema = void 0;
exports.validateWeatherQuery = validateWeatherQuery;
const zod_1 = require("zod");
exports.weatherCityQuerySchema = zod_1.z.object({
    city: zod_1.z.string().trim().min(2, "City name must contain at least 2 characters.").max(150),
    country: zod_1.z.string().trim().max(100).optional(),
});
exports.weatherCoordinatesQuerySchema = zod_1.z.object({
    lat: zod_1.z.coerce.number().min(-90).max(90),
    lon: zod_1.z.coerce.number().min(-180).max(180),
});
exports.weatherQuerySchema = zod_1.z.union([
    exports.weatherCityQuerySchema,
    exports.weatherCoordinatesQuerySchema,
]);
function validateWeatherQuery(data) {
    if (typeof data === "object" && data !== null && ("lat" in data || "lon" in data)) {
        return exports.weatherCoordinatesQuerySchema.safeParse(data);
    }
    return exports.weatherCityQuerySchema.safeParse(data);
}
