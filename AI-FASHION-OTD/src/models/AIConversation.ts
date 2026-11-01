import mongoose, {
    Schema,
    type Document,
    type Model,
    type Types,
} from "mongoose";

export type AIConversationStatus = "active" | "archived";

export interface IAIConversation extends Document {
    userId: Types.ObjectId;
    title: string;
    status: AIConversationStatus;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IAIConversationModel extends Model<IAIConversation> { }

const aiConversationSchema = new Schema<IAIConversation>(
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
            minlength: 1,
            maxlength: 150,
            default: "New conversation",
        },

        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
            required: true,
        },

        lastMessageAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "ai_conversations",
    },
);

// Efficiently retrieve a user's conversations, newest activity first.
aiConversationSchema.index({
    userId: 1,
    status: 1,
    lastMessageAt: -1,
    updatedAt: -1,
});

export const AIConversation: Model<IAIConversation> =
    (mongoose.models.AIConversation as Model<IAIConversation> | undefined) ??
    mongoose.model<IAIConversation>(
        "AIConversation",
        aiConversationSchema,
    );

export default AIConversation;
