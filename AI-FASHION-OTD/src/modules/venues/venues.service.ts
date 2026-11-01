import mongoose from "mongoose";
import Venue from "../../models/Venue";
import VenueIntelligence from "../../models/VenueIntelligence";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type { CreateVenueDto, VenueQueryDto } from "./venues.validator";

export class VenueServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "VenueServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new VenueServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function createVenue(userId: string, input: CreateVenueDto) {
    const userObjectId = toObjectId(userId);

    const venue = await Venue.create({
        ...input,
        createdBy: userObjectId,
        isActive: true,
    });

    return venue.toObject();
}

export async function getVenues(query: Partial<VenueQueryDto> = {}) {
    const { page, limit, skip } = parsePagination(query, 20, 50);

    const filter: Record<string, unknown> = { isActive: true };

    if (query.city) filter.city = new RegExp(`^${query.city.trim()}$`, "i");
    if (query.venueType) filter.venueType = query.venueType;
    if (query.indoor !== undefined) filter.indoor = query.indoor;
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: "i" } },
            { address: { $regex: query.search, $options: "i" } },
            { description: { $regex: query.search, $options: "i" } },
        ];
    }

    const [venues, total] = await Promise.all([
        Venue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
        Venue.countDocuments(filter).exec(),
    ]);

    return {
        venues,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function getVenueById(venueId: string) {
    const venueObjectId = toObjectId(venueId);

    const venue = await Venue.findById(venueObjectId).lean().exec();
    if (!venue || !venue.isActive) {
        throw new VenueServiceError("Venue not found.", 404);
    }

    return venue;
}

export async function getVenueIntelligence(
    userId: string,
    venueId: string,
    occasion?: string,
) {
    const userObjectId = toObjectId(userId);
    const venueObjectId = toObjectId(venueId);

    const venue = await Venue.findById(venueObjectId).lean().exec();
    if (!venue) {
        throw new VenueServiceError("Venue not found.", 404);
    }

    // Determine recommendations based on venueType & dressCode
    const recommendedStyles: string[] = [];
    const recommendedColors: string[] = [];
    const recommendedClothing: string[] = [];
    const recommendations: string[] = [];

    const dressCode = (venue.dressCode || "casual").toLowerCase();

    if (dressCode.includes("formal") || venue.venueType === "wedding_hall") {
        recommendedStyles.push("formal", "smart-casual");
        recommendedColors.push("navy", "black", "burgundy", "charcoal");
        recommendedClothing.push("tailored suit", "formal dress", "oxford shoes", "heels");
        recommendations.push("Stick to formal or semi-formal attire. Avoid casual sneakers, shorts, and graphic tees.");
    } else if (dressCode.includes("smart") || venue.venueType === "office" || venue.venueType === "hotel") {
        recommendedStyles.push("smart-casual", "minimalist");
        recommendedColors.push("blue", "white", "beige", "olive");
        recommendedClothing.push("chinos", "button-down shirt", "blazer", "loafers", "clean minimalist sneakers");
        recommendations.push("Smart casual attire is ideal. Polished shoes and well-fitted trousers elevate the look.");
    } else if (venue.venueType === "cafe" || venue.venueType === "restaurant") {
        recommendedStyles.push("casual", "smart-casual");
        recommendedColors.push("earth tones", "denim", "neutral");
        recommendedClothing.push("jeans", "casual jacket", "comfortable shoes");
        recommendations.push("Relaxed and comfortable styling with clean lines.");
    } else {
        recommendedStyles.push("casual", "sporty");
        recommendedClothing.push("comfortable walking shoes", "casual layers");
        recommendations.push("Dress comfortably for movement and potential weather changes.");
    }

    if (!venue.indoor) {
        recommendations.push("Outdoor venue: verify weather forecasts and consider sunglasses or layering.");
    }

    const summary = `${venue.name} is a ${venue.indoor ? "indoor" : "outdoor"} ${venue.venueType.replace("_", " ")} with a ${venue.dressCode || "casual"} dress code.`;

    // Save or update intelligence record
    const intelligence = await VenueIntelligence.create({
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
