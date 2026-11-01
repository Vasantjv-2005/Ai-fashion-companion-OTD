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
exports.USER_TREND_INTERACTION_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.USER_TREND_INTERACTION_TYPES = [
    "view",
    "like",
    "save",
    "share",
    "dismiss",
    "click",
];
const userTrendInteractionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    trendId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "FashionTrend",
        required: true,
    },
    interactionType: {
        type: String,
        enum: exports.USER_TREND_INTERACTION_TYPES,
        required: true,
    },
    interactedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
}, {
    timestamps: true,
    collection: "user_trend_interactions",
    versionKey: false,
});
// Efficiently retrieve a user's interactions with fashion trends.
userTrendInteractionSchema.index({
    userId: 1,
    interactedAt: -1,
});
// Find interactions for a specific trend.
userTrendInteractionSchema.index({
    trendId: 1,
    interactionType: 1,
});
// Support personalized trend recommendations.
userTrendInteractionSchema.index({
    userId: 1,
    trendId: 1,
    interactionType: 1,
});
const UserTrendInteraction = mongoose_1.default.models.UserTrendInteraction ||
    mongoose_1.default.model("UserTrendInteraction", userTrendInteractionSchema);
exports.default = UserTrendInteraction;
