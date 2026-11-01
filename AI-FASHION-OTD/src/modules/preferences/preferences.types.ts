export interface RecommendationSettings {
    useWeather: boolean;
    considerOccasion: boolean;
    avoidRecentOutfits: boolean;
}

export interface UserPreferenceData {
    id: string;
    userId: string;
    preferredStyles: string[];
    preferredColors: string[];
    preferredSeasons: string[];
    preferredCategories: string[];
    excludedColors: string[];
    budgetMin: number;
    budgetMax?: number;
    preferredFit: "slim" | "regular" | "relaxed" | "oversized" | "no-preference";
    recommendationSettings: RecommendationSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface UpdatePreferencesInput {
    preferredStyles?: string[];
    preferredColors?: string[];
    preferredSeasons?: string[];
    preferredCategories?: string[];
    excludedColors?: string[];
    budgetMin?: number;
    budgetMax?: number;
    preferredFit?: "slim" | "regular" | "relaxed" | "oversized" | "no-preference";
    recommendationSettings?: Partial<RecommendationSettings>;
}

