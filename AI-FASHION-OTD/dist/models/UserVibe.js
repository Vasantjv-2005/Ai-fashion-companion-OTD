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
exports.UserVibe = exports.USER_VIBE_OCCASIONS = exports.USER_VIBE_MOODS = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.USER_VIBE_MOODS = [
    "casual",
    "confident",
    "elegant",
    "sporty",
    "minimalist",
    "streetwear",
    "romantic",
    "professional",
    "creative",
    "adventurous",
];
exports.USER_VIBE_OCCASIONS = [
    "daily",
    "work",
    "college",
    "party",
    "date",
    "wedding",
    "travel",
    "fitness",
    "special_event",
];
const userVibeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mood: {
        type: String,
        enum: exports.USER_VIBE_MOODS,
        required: true,
    },
    preferredStyles: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    preferredColors: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    preferredSeasons: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    occasion: {
        type: String,
        enum: exports.USER_VIBE_OCCASIONS,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    collection: "user_vibes",
    versionKey: false,
});
userVibeSchema.index({
    userId: 1,
    isActive: 1,
    updatedAt: -1,
});
exports.UserVibe = mongoose_1.default.models.UserVibe ||
    mongoose_1.default.model("UserVibe", userVibeSchema);
exports.default = exports.UserVibe;
