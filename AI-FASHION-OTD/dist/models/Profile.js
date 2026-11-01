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
exports.Profile = exports.PROFILE_SEASONS = exports.PROFILE_STYLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.PROFILE_STYLES = [
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
exports.PROFILE_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
];
const ProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    displayName: {
        type: String,
        trim: true,
        minlength: 2,
        maxlength: 100,
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
    },
    avatarFileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: undefined,
    },
    preferredStyles: {
        type: [
            {
                type: String,
                enum: exports.PROFILE_STYLES,
            },
        ],
        default: [],
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
                enum: exports.PROFILE_SEASONS,
            },
        ],
        default: [],
    },
    preferredCategories: {
        type: [String],
        default: [],
    },
    bodyType: {
        type: String,
        trim: true,
        maxlength: 50,
        default: undefined,
    },
    heightCm: {
        type: Number,
        min: 50,
        max: 300,
        default: undefined,
    },
    fashionGoals: {
        type: [String],
        default: [],
    },
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    collection: "profiles",
    versionKey: false,
});
exports.Profile = mongoose_1.default.models.Profile ||
    mongoose_1.default.model("Profile", ProfileSchema);
exports.default = exports.Profile;
