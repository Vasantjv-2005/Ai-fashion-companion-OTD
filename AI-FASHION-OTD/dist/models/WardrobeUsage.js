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
exports.WARDROBE_USAGE_OCCASIONS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.WARDROBE_USAGE_OCCASIONS = [
    "daily",
    "work",
    "college",
    "party",
    "date",
    "wedding",
    "travel",
    "fitness",
    "special_event",
    "other",
];
const wardrobeUsageSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    wardrobeItemId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "WardrobeItem",
        required: true,
    },
    outfitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Outfit",
    },
    eventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Event",
    },
    occasion: {
        type: String,
        enum: exports.WARDROBE_USAGE_OCCASIONS,
        default: "daily",
        required: true,
    },
    usedAt: {
        type: Date,
        default: Date.now,
        required: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
}, {
    timestamps: true,
    collection: "wardrobe_usage",
    versionKey: false,
});
// Find a user's clothing usage history.
wardrobeUsageSchema.index({
    userId: 1,
    usedAt: -1,
});
// Analyze how often an item is worn.
wardrobeUsageSchema.index({
    wardrobeItemId: 1,
    usedAt: -1,
});
// Retrieve clothing usage associated with an outfit.
wardrobeUsageSchema.index({
    outfitId: 1,
    usedAt: -1,
});
// Support usage analysis by occasion.
wardrobeUsageSchema.index({
    userId: 1,
    occasion: 1,
    usedAt: -1,
});
const WardrobeUsage = mongoose_1.default.models.WardrobeUsage ||
    mongoose_1.default.model("WardrobeUsage", wardrobeUsageSchema);
exports.default = WardrobeUsage;
