import mongoose, { Schema, type InferSchemaType } from "mongoose";

const eventSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        eventType: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 50,
        },
        date: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        dressCode: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 50,
            default: "casual",
        },
    },
    {
        timestamps: true,
        collection: "events",
    },
);

eventSchema.index({ userId: 1, date: 1 });

export type EventDocument = InferSchemaType<typeof eventSchema>;

export const Event =
    (mongoose.models.Event as mongoose.Model<EventDocument>) ||
    mongoose.model<EventDocument>("Event", eventSchema);

export default Event;
