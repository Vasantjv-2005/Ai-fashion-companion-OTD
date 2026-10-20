
import mongoose, { Schema } from "mongoose";

const GROUP_EVENT_TYPES = [
    "party",
    "wedding",
    "birthday",
    "travel",
    "work",
    "festival",
    "photoshoot",
    "casual",
    "other",
] as const;

const GROUP_EVENT_VISIBILITY = [
    "private",
    "invite-only",
    "public",
] as const;

const groupEventSchema = new Schema(
    {
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },

        eventType: {
            type: String,
            enum: GROUP_EVENT_TYPES,
            default: "other",
            required: true,
        },

        startsAt: {
            type: Date,
            required: true,
        },

        endsAt: {
            type: Date,
            default: undefined,
        },

        location: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },

        venueId: {
            type: Schema.Types.ObjectId,
            ref: "Venue",
            default: undefined,
        },

        dressCode: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "casual",
        },

        visibility: {
            type: String,
            enum: GROUP_EVENT_VISIBILITY,
            default: "invite-only",
            required: true,
        },

        maxMembers: {
            type: Number,
            min: 2,
            max: 1000,
            default: 20,
        },

        isCancelled: {
            type: Boolean,
            default: false,
            index: true,
        },

        cancelledAt: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "group_events",
        versionKey: false,
    }
);

groupEventSchema.index({ creatorId: 1, startsAt: 1 });
groupEventSchema.index({ visibility: 1, startsAt: 1 });

export type GroupEventDocument =
    mongoose.InferSchemaType<typeof groupEventSchema>;

export const GroupEvent =
    (mongoose.models.GroupEvent as mongoose.Model<GroupEventDocument>) ||
    mongoose.model<GroupEventDocument>(
        "GroupEvent",
        groupEventSchema
    );

export default GroupEvent;