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
exports.UserPreference = exports.USER_PREFERENCE_FITS = exports.USER_PREFERENCE_CATEGORIES = exports.USER_PREFERENCE_SEASONS = exports.USER_PREFERENCE_STYLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.USER_PREFERENCE_STYLES = [
    "casual",
    "formal",
    "smart-casual",
    "streetwear",
    "sporty",
    "traditional",
    "party",
    "minimalist",
    "other",
];
exports.USER_PREFERENCE_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
];
exports.USER_PREFERENCE_CATEGORIES = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
    "activewear",
    "ethnic-wear",
    "other",
];
exports.USER_PREFERENCE_FITS = [
    "slim",
    "regular",
    "relaxed",
    "oversized",
    "no-preference",
];
const userPreferenceSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    preferredStyles: {
        type: [
            {
                type: String,
                enum: exports.USER_PREFERENCE_STYLES,
            },
        ],
        default: ["casual"],
    },
    preferredColors: {
        type: [
            {
                type: String,
                trim: true,
                maxlength: 50,
            },
        ],
        default: [],
    },
    preferredSeasons: {
        type: [
            {
                type: String,
                enum: exports.USER_PREFERENCE_SEASONS,
            },
        ],
        default: ["all-season"],
    },
    preferredCategories: {
        type: [
            {
                type: String,
                enum: exports.USER_PREFERENCE_CATEGORIES,
            },
        ],
        default: [],
    },
    excludedColors: {
        type: [
            {
                type: String,
                trim: true,
                maxlength: 50,
            },
        ],
        default: [],
    },
    budgetMin: {
        type: Number,
        min: 0,
        default: 0,
    },
    budgetMax: {
        type: Number,
        min: 0,
        default: undefined,
    },
    preferredFit: {
        type: String,
        enum: exports.USER_PREFERENCE_FITS,
        default: "no-preference",
    },
    recommendationSettings: {
        useWeather: {
            type: Boolean,
            default: true,
        },
        considerOccasion: {
            type: Boolean,
            default: true,
        },
        avoidRecentOutfits: {
            type: Boolean,
            default: true,
        },
    },
}, {
    timestamps: true,
    collection: "user_preferences",
    versionKey: false,
});
exports.UserPreference = mongoose_1.default.models.UserPreference ||
    mongoose_1.default.model("UserPreference", userPreferenceSchema);
exports.default = exports.UserPreference;
