"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueServiceError = void 0;
exports.createVenue = createVenue;
exports.getVenues = getVenues;
exports.getVenueById = getVenueById;
exports.getVenueIntelligence = getVenueIntelligence;
const mongoose_1 = __importDefault(require("mongoose"));
const Venue_1 = __importDefault(require("../../models/Venue"));
const VenueIntelligence_1 = __importDefault(require("../../models/VenueIntelligence"));
const pagination_1 = require("../../utils/pagination");
class VenueServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "VenueServiceError";
    }
}
exports.VenueServiceError = VenueServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new VenueServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function createVenue(userId, input) {
    const userObjectId = toObjectId(userId);
    const venue = await Venue_1.default.create({
        ...input,
        createdBy: userObjectId,
        isActive: true,
    });
    return venue.toObject();
}
async function getVenues(query = {}) {
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 20, 50);
    const filter = { isActive: true };
    if (query.city)
        filter.city = new RegExp(`^${query.city.trim()}$`, "i");
    if (query.venueType)
        filter.venueType = query.venueType;
    if (query.indoor !== undefined)
        filter.indoor = query.indoor;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { address: { $regex: query.search, $options: "i" } },
            { description: { $regex: query.search, $options: "i" } },
        ];
    }
    const [venues, total] = await Promise.all([
        Venue_1.default.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
        Venue_1.default.countDocuments(filter).exec(),
    ]);
    return {
        venues,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function getVenueById(venueId) {
    const venueObjectId = toObjectId(venueId);
    const venue = await Venue_1.default.findById(venueObjectId).lean().exec();
    if (!venue || !venue.isActive) {
        throw new VenueServiceError("Venue not found.", 404);
    }
    return venue;
}
async function getVenueIntelligence(userId, venueId, occasion) {
    const userObjectId = toObjectId(userId);
    const venueObjectId = toObjectId(venueId);
    const venue = await Venue_1.default.findById(venueObjectId).lean().exec();
    if (!venue) {
        throw new VenueServiceError("Venue not found.", 404);
    }
    // Determine recommendations based on venueType & dressCode
    const recommendedStyles = [];
    const recommendedColors = [];
    const recommendedClothing = [];
    const recommendations = [];
    const dressCode = (venue.dressCode || "casual").toLowerCase();
    if (dressCode.includes("formal") || venue.venueType === "wedding_hall") {
        recommendedStyles.push("formal", "smart-casual");
        recommendedColors.push("navy", "black", "burgundy", "charcoal");
        recommendedClothing.push("tailored suit", "formal dress", "oxford shoes", "heels");
        recommendations.push("Stick to formal or semi-formal attire. Avoid casual sneakers, shorts, and graphic tees.");
    }
    else if (dressCode.includes("smart") || venue.venueType === "office" || venue.venueType === "hotel") {
        recommendedStyles.push("smart-casual", "minimalist");
        recommendedColors.push("blue", "white", "beige", "olive");
        recommendedClothing.push("chinos", "button-down shirt", "blazer", "loafers", "clean minimalist sneakers");
        recommendations.push("Smart casual attire is ideal. Polished shoes and well-fitted trousers elevate the look.");
    }
    else if (venue.venueType === "cafe" || venue.venueType === "restaurant") {
        recommendedStyles.push("casual", "smart-casual");
        recommendedColors.push("earth tones", "denim", "neutral");
        recommendedClothing.push("jeans", "casual jacket", "comfortable shoes");
        recommendations.push("Relaxed and comfortable styling with clean lines.");
    }
    else {
        recommendedStyles.push("casual", "sporty");
        recommendedClothing.push("comfortable walking shoes", "casual layers");
        recommendations.push("Dress comfortably for movement and potential weather changes.");
    }
    if (!venue.indoor) {
        recommendations.push("Outdoor venue: verify weather forecasts and consider sunglasses or layering.");
    }
    const summary = `${venue.name} is a ${venue.indoor ? "indoor" : "outdoor"} ${venue.venueType.replace("_", " ")} with a ${venue.dressCode || "casual"} dress code.`;
    // Save or update intelligence record
    const intelligence = await VenueIntelligence_1.default.create({
        venueId: venueObjectId,
        userId: userObjectId,
        venueName: venue.name,
        venueType: venue.venueType,
        occasion: occasion || venue.suitableOccasions[0] || "casual",
        dressCode: venue.dressCode || "casual",
        recommendedStyles,
        recommendedColors,
        recommendedClothing,
        indoor: venue.indoor,
        intelligenceType: "dress_code",
        summary,
        recommendations,
        source: "Fashion Intelligence Engine",
    });
    return intelligence.toObject();
}
