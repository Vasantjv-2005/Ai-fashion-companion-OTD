"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const socialLikeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    postId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "OutfitShare",
        default: undefined,
    },
    commentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "SocialComment",
        default: undefined,
    },
}, {
    timestamps: true,
    collection: "social_likes",
    versionKey: false,
});
// A like must belong to either a post or a comment, but not both.
socialLikeSchema.pre("validate", function () {
    const hasPost = Boolean(this.postId);
    const hasComment = Boolean(this.commentId);
    if (hasPost === hasComment) {
        this.invalidate("postId", "A like must belong to exactly one post or comment.");
    }
});
// Prevent duplicate likes on the same post.
socialLikeSchema.index({ userId: 1, postId: 1 }, {
    unique: true,
    partialFilterExpression: { postId: { $type: "objectId" } },
});
// Prevent duplicate likes on the same comment.
socialLikeSchema.index({ userId: 1, commentId: 1 }, {
    unique: true,
    partialFilterExpression: { commentId: { $type: "objectId" } },
});
socialLikeSchema.index({ postId: 1, createdAt: -1 });
socialLikeSchema.index({ commentId: 1, createdAt: -1 });
const SocialLike = mongoose_1.default.models.SocialLike ||
    mongoose_1.default.model("SocialLike", socialLikeSchema);
exports.default = SocialLike;
