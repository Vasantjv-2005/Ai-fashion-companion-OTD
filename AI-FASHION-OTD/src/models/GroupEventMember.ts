import mongoose, { Schema } from "mongoose";

const GROUP_MEMBER_ROLES = [
    "organizer",
    "member",
] as const;

const GROUP_MEMBER_STATUSES = [
    "invited",
    "accepted",
    "declined",
    "removed",
] as const;

const GROUP_MEMBER_RSVP = [
    "pending",
    "attending",
    "not-attending",
    "maybe",
] as const;

const groupEventMemberSchema = new Schema(
    {
        groupEventId: {
            type: Schema.Types.ObjectId,
            ref: "GroupEvent",
            required: true,
            index: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        role: {
            type: String,
            enum: GROUP_MEMBER_ROLES,
            default: "member",
            required: true,
        },

        status: {
            type: String,
            enum: GROUP_MEMBER_STATUSES,
            default: "invited",
            required: true,
        },

        rsvp: {
            type: String,
            enum: GROUP_MEMBER_RSVP,
            default: "pending",
            required: true,
        },

        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: undefined,
        },

        invitedAt: {
            type: Date,
            default: Date.now,
        },

        respondedAt: {
            type: Date,
            default: undefined,
        },

        joinedAt: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "group_event_members",
        versionKey: false,
    }
);

// A user can have only one membership record per group event.
groupEventMemberSchema.index(
    { groupEventId: 1, userId: 1 },
    { unique: true }
);

groupEventMemberSchema.index({ userId: 1, status: 1 });

export type GroupEventMemberDocument =
    mongoose.InferSchemaType<typeof groupEventMemberSchema>;

export const GroupEventMember =
    (mongoose.models.GroupEventMember as mongoose.Model<GroupEventMemberDocument>) ||
    mongoose.model<GroupEventMemberDocument>(
        "GroupEventMember",
        groupEventMemberSchema
    );

export default GroupEventMember;
