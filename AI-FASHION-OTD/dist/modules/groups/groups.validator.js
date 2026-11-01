"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votePollSchema = exports.createPollSchema = exports.rsvpSchema = exports.updateGroupEventSchema = exports.createGroupEventSchema = void 0;
exports.validateCreateGroupEvent = validateCreateGroupEvent;
exports.validateUpdateGroupEvent = validateUpdateGroupEvent;
exports.validateRsvp = validateRsvp;
exports.validateCreatePoll = validateCreatePoll;
exports.validateVotePoll = validateVotePoll;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const GroupEvent_1 = require("../../models/GroupEvent");
const GroupEventMember_1 = require("../../models/GroupEventMember");
const OutfitPoll_1 = require("../../models/OutfitPoll");
exports.createGroupEventSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(150),
    description: zod_1.z.string().trim().max(2000).optional().default(""),
    eventType: zod_1.z.enum(GroupEvent_1.GROUP_EVENT_TYPES).optional().default("other"),
    startsAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).transform((d) => new Date(d)),
    endsAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    location: zod_1.z.string().trim().max(200).optional().default(""),
    dressCode: zod_1.z.string().trim().max(100).optional().default("casual"),
    visibility: zod_1.z.enum(GroupEvent_1.GROUP_EVENT_VISIBILITY).optional().default("invite-only"),
    maxMembers: zod_1.z.number().int().min(2).max(1000).optional().default(20),
});
exports.updateGroupEventSchema = zod_1.z
    .object({
    title: zod_1.z.string().trim().min(2).max(150).optional(),
    description: zod_1.z.string().trim().max(2000).optional(),
    eventType: zod_1.z.enum(GroupEvent_1.GROUP_EVENT_TYPES).optional(),
    startsAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    endsAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    location: zod_1.z.string().trim().max(200).optional(),
    dressCode: zod_1.z.string().trim().max(100).optional(),
    visibility: zod_1.z.enum(GroupEvent_1.GROUP_EVENT_VISIBILITY).optional(),
    maxMembers: zod_1.z.number().int().min(2).max(1000).optional(),
    isCancelled: zod_1.z.boolean().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
});
exports.rsvpSchema = zod_1.z.object({
    rsvp: zod_1.z.enum(GroupEventMember_1.GROUP_MEMBER_RSVP),
});
exports.createPollSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(150),
    description: zod_1.z.string().trim().max(1000).optional().default(""),
    visibility: zod_1.z.enum(OutfitPoll_1.OUTFIT_POLL_VISIBILITY).optional().default("private"),
    allowMultipleVotes: zod_1.z.boolean().optional().default(false),
    endsAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
    options: zod_1.z
        .array(zod_1.z.object({
        label: zod_1.z.string().trim().min(1).max(150),
        outfitId: common_validator_1.objectIdSchema.optional(),
        wardrobeItemIds: zod_1.z.array(common_validator_1.objectIdSchema).optional(),
        description: zod_1.z.string().trim().max(500).optional(),
    }))
        .min(2, "A poll must have at least 2 options.")
        .max(10, "A poll can have at most 10 options."),
});
exports.votePollSchema = zod_1.z.object({
    optionId: common_validator_1.objectIdSchema,
});
function validateCreateGroupEvent(data) {
    return exports.createGroupEventSchema.safeParse(data);
}
function validateUpdateGroupEvent(data) {
    return exports.updateGroupEventSchema.safeParse(data);
}
function validateRsvp(data) {
    return exports.rsvpSchema.safeParse(data);
}
function validateCreatePoll(data) {
    return exports.createPollSchema.safeParse(data);
}
function validateVotePoll(data) {
    return exports.votePollSchema.safeParse(data);
}
