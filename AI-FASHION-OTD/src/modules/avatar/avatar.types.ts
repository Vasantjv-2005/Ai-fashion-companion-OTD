import type { AvatarSource } from "../../models/Avatar";

export interface AvatarResponseData {
    id: string;
    userId: string;
    imageFileId?: string;
    imageUrl?: string;
    source: AvatarSource;
    displayName: string;
    metadata?: Record<string, unknown>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateAvatarInput {
    displayName?: string;
    source?: AvatarSource;
    imageUrl?: string;
    imageFileId?: string;
    metadata?: Record<string, unknown>;
}

export interface UpdateAvatarInput {
    displayName?: string;
    source?: AvatarSource;
    imageUrl?: string;
    imageFileId?: string;
    metadata?: Record<string, unknown>;
    isActive?: boolean;
}

