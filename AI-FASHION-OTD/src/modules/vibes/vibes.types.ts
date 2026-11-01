import type { UserVibeMood, UserVibeOccasion } from "../../models/UserVibe";

export interface UserVibeData {
    id: string;
    userId: string;
    mood: UserVibeMood;
    preferredStyles: string[];
    preferredColors: string[];
    preferredSeasons: string[];
    occasion?: UserVibeOccasion;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateVibeData {
    mood: UserVibeMood;
    preferredStyles?: string[];
    preferredColors?: string[];
    preferredSeasons?: string[];
    occasion?: UserVibeOccasion;
    notes?: string;
}

export interface PresetVibe {
    name: string;
    mood: UserVibeMood;
    description: string;
    recommendedStyles: string[];
    recommendedColors: string[];
}

