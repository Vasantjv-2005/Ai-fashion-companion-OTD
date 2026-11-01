import type { VenueType } from "../../models/Venue";
import type { VenueIntelligenceType } from "../../models/VenueIntelligence";

export interface CreateVenueData {
    name: string;
    venueType?: VenueType;
    description?: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    dressCode?: string;
    indoor?: boolean;
    suitableOccasions?: string[];
    imageUrl?: string;
    websiteUrl?: string;
}

export interface VenueFilterQuery {
    city?: string;
    venueType?: VenueType;
    search?: string;
    indoor?: boolean;
    page?: number;
    limit?: number;
}

export interface VenueIntelligenceResult {
    venueName: string;
    venueType?: string;
    dressCode?: string;
    indoor: boolean;
    recommendedStyles: string[];
    recommendedColors: string[];
    recommendedClothing: string[];
    summary: string;
    recommendations: string[];
}

