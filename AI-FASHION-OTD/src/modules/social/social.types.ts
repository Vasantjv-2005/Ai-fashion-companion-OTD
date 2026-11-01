import type { OutfitShareVisibility } from "../../models/OutfitShare";

export interface ShareOutfitData {
    outfitId: string;
    title?: string;
    description?: string;
    visibility?: OutfitShareVisibility;
    expiresAt?: Date;
}

export interface SocialFeedItem {
    id: string;
    outfitId: string;
    userId: string;
    authorName?: string;
    title: string;
    description: string;
    visibility: OutfitShareVisibility;
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser?: boolean;
    createdAt: Date;
}

export interface AddCommentData {
    content: string;
    parentCommentId?: string;
}

