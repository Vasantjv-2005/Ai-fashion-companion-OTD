import type { ProfileSeason, ProfileStyle } from "../../models/Profile";

export type { ProfileSeason, ProfileStyle };

export interface ProfileData {
    id: string;
    userId: string;
    displayName?: string;
    bio?: string;
    avatarFileId?: string;
    preferredStyles: ProfileStyle[];
    preferredColors: string[];
    preferredSeasons: ProfileSeason[];
    preferredCategories: string[];
    bodyType?: string;
    heightCm?: number;
    fashionGoals: string[];
    isProfileComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateProfileData {
    displayName?: string;
    bio?: string;
    avatarFileId?: string;
    preferredStyles?: ProfileStyle[];
    preferredColors?: string[];
    preferredSeasons?: ProfileSeason[];
    preferredCategories?: string[];
    bodyType?: string;
    heightCm?: number;
    fashionGoals?: string[];
}

export type UpdateProfileData = Partial<CreateProfileData>;

