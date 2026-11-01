import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import { GROUP_EVENT_TYPES, GROUP_EVENT_VISIBILITY } from "../../models/GroupEvent";
import { GROUP_MEMBER_RSVP } from "../../models/GroupEventMember";
import { OUTFIT_POLL_VISIBILITY } from "../../models/OutfitPoll";

export const createGroupEventSchema = z.object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(2000).optional().default(""),
    eventType: z.enum(GROUP_EVENT_TYPES).optional().default("other"),
    startsAt: z.union([z.string().datetime(), z.date()]).transform((d) => new Date(d)),
    endsAt: z.union([z.string().datetime(), z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    location: z.string().trim().max(200).optional().default(""),
    dressCode: z.string().trim().max(100).optional().default("casual"),
    visibility: z.enum(GROUP_EVENT_VISIBILITY).optional().default("invite-only"),
    maxMembers: z.number().int().min(2).max(1000).optional().default(20),
});

export const updateGroupEventSchema = z
    .object({
        title: z.string().trim().min(2).max(150).optional(),
        description: z.string().trim().max(2000).optional(),
        eventType: z.enum(GROUP_EVENT_TYPES).optional(),
        startsAt: z.union([z.string().datetime(), z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
        endsAt: z.union([z.string().datetime(), z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
        location: z.string().trim().max(200).optional(),
        dressCode: z.string().trim().max(100).optional(),
        visibility: z.enum(GROUP_EVENT_VISIBILITY).optional(),
        maxMembers: z.number().int().min(2).max(1000).optional(),
        isCancelled: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.",
    });

export const rsvpSchema = z.object({
    rsvp: z.enum(GROUP_MEMBER_RSVP),
});

export const createPollSchema = z.object({
    title: z.string().trim().min(2).max(150),
    description: z.string().trim().max(1000).optional().default(""),
    visibility: z.enum(OUTFIT_POLL_VISIBILITY).optional().default("private"),
    allowMultipleVotes: z.boolean().optional().default(false),
    endsAt: z.union([z.string().datetime(), z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    options: z
        .array(
            z.object({
                label: z.string().trim().min(1).max(150),
                outfitId: objectIdSchema.optional(),
                wardrobeItemIds: z.array(objectIdSchema).optional(),
                description: z.string().trim().max(500).optional(),
            }),
        )
        .min(2, "A poll must have at least 2 options.")
        .max(10, "A poll can have at most 10 options."),
});

export const votePollSchema = z.object({
    optionId: objectIdSchema,
});

export type CreateGroupEventDto = z.infer<typeof createGroupEventSchema>;
export type UpdateGroupEventDto = z.infer<typeof updateGroupEventSchema>;
export type RsvpDto = z.infer<typeof rsvpSchema>;
export type CreatePollDto = z.infer<typeof createPollSchema>;
export type VotePollDto = z.infer<typeof votePollSchema>;

export function validateCreateGroupEvent(data: unknown) {
    return createGroupEventSchema.safeParse(data);
}

export function validateUpdateGroupEvent(data: unknown) {
    return updateGroupEventSchema.safeParse(data);
}

export function validateRsvp(data: unknown) {
    return rsvpSchema.safeParse(data);
}

export function validateCreatePoll(data: unknown) {
    return createPollSchema.safeParse(data);
}

export function validateVotePoll(data: unknown) {
    return votePollSchema.safeParse(data);
}

