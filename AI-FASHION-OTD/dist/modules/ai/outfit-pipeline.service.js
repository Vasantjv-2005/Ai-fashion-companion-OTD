"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutfitPipelineError = void 0;
exports.runOutfitPipeline = runOutfitPipeline;
const mongoose_1 = __importDefault(require("mongoose"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
const UserPreference_1 = __importDefault(require("../../models/UserPreference"));
const outfit_generation_service_1 = require("../outfits/outfit-generation.service");
const weather_client_1 = require("../../integrations/weather/weather.client");
class OutfitPipelineError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "OutfitPipelineError";
    }
}
exports.OutfitPipelineError = OutfitPipelineError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new OutfitPipelineError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function runOutfitPipeline(userId, input) {
    const userObjectId = toObjectId(userId);
    const startTime = Date.now();
    // 1. Fetch user preferences
    const preferences = await UserPreference_1.default.findOne({ userId: userObjectId }).lean().exec();
    const targetStyle = input.style || preferences?.preferredStyles?.[0] || "casual";
    const targetSeason = input.season || preferences?.preferredSeasons?.[0] || "all-season";
    // 2. Fetch weather context if coordinates are supplied
    let weatherContext = undefined;
    if (input.coordinates) {
        try {
            const weather = await (0, weather_client_1.getWeatherForCoordinates)(input.coordinates.latitude, input.coordinates.longitude);
            weatherContext = {
                temperatureC: weather.temperatureC,
                condition: weather.condition,
                description: `${weather.condition}, ${weather.temperatureC}°C`,
            };
        }
        catch {
            // Weather service failure should not block outfit pipeline
        }
    }
    // 3. Count total wardrobe items
    const totalWardrobeItems = await WardrobeItem_1.default.countDocuments({
        userId: userObjectId,
    }).exec();
    if (totalWardrobeItems === 0) {
        throw new OutfitPipelineError("No clothing items found in your wardrobe. Please add items to receive recommendations.", 400);
    }
    // 4. Generate recommendations using heuristic and AI outfit generation engine
    const generationResult = await (0, outfit_generation_service_1.generateOutfitRecommendations)(userId, {
        occasion: input.occasion,
        requestedStyle: targetStyle,
        season: targetSeason,
        excludedItemIds: input.excludedItemIds,
        preferredColor: input.preferredColor || preferences?.preferredColors?.[0],
    });
    const processingTimeMs = Date.now() - startTime;
    return {
        outfits: generationResult.recommendations,
        weatherContext,
        pipelineSteps: {
            totalWardrobeItems,
            candidatesEvaluated: generationResult.total * 3,
            validatedOutfits: generationResult.total,
            processingTimeMs,
        },
    };
}
