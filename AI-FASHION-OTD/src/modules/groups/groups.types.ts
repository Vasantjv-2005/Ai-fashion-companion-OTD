import type { GroupEventType, GroupEventVisibility } from "../../models/GroupEvent";
import type { GroupMemberRole, GroupMemberRsvp, GroupMemberStatus } from "../../models/GroupEventMember";
import type { OutfitPollVisibility } from "../../models/OutfitPoll";

export interface CreateGroupEventData {
    title: string;
    description?: string;
    eventType?: GroupEventType;
    startsAt: Date;
    endsAt?: Date;
    location?: string;
    dressCode?: string;
    visibility?: GroupEventVisibility;
    maxMembers?: number;
}

export interface UpdateGroupEventData {
    title?: string;
    description?: string;
    eventType?: GroupEventType;
    startsAt?: Date;
    endsAt?: Date;
    location?: string;
    dressCode?: string;
    visibility?: GroupEventVisibility;
    maxMembers?: number;
    isCancelled?: boolean;
}

export interface MemberRsvpData {
    rsvp: GroupMemberRsvp;
}

export interface CreatePollOptionData {
    label: string;
    outfitId?: string;
    wardrobeItemIds?: string[];
    description?: string;
}

export interface CreatePollData {
    title: string;
    description?: string;
    visibility?: OutfitPollVisibility;
    allowMultipleVotes?: boolean;
    endsAt?: Date;
    options: CreatePollOptionData[];
}

