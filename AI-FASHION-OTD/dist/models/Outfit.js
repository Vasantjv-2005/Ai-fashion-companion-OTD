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
exports.Outfit = exports.OUTFIT_SEASONS = exports.OUTFIT_STYLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.OUTFIT_STYLES = [
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
exports.OUTFIT_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
];
const outfitSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    name: {
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
    wardrobeItemIds: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "WardrobeItem",
            },
        ],
        required: true,
        validate: {
            validator: (items) => items.length > 0,
            message: "An outfit must contain at least one wardrobe item.",
        },
    },
    occasion: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 100,
        default: "casual",
    },
    style: {
        type: String,
        enum: exports.OUTFIT_STYLES,
        default: "casual",
    },
    season: {
        type: String,
        enum: exports.OUTFIT_SEASONS,
        default: "all-season",
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    wornAt: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
    collection: "outfits",
    versionKey: false,
});
outfitSchema.index({ userId: 1, createdAt: -1 });
outfitSchema.index({ userId: 1, isFavorite: 1 });
exports.Outfit = mongoose_1.default.models.Outfit ||
    mongoose_1.default.model("Outfit", outfitSchema);
exports.default = exports.Outfit;
