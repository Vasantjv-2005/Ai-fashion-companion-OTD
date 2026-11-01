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
exports.VenueIntelligence = exports.VENUE_INTELLIGENCE_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.VENUE_INTELLIGENCE_TYPES = [
    "dress_code",
    "weather",
    "occasion",
    "style_recommendation",
    "cultural_guidelines",
    "general",
];
const venueIntelligenceSchema = new mongoose_1.Schema({
    venueId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Venue",
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    venueName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    venueType: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    occasion: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    dressCode: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    recommendedStyles: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    recommendedColors: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    recommendedClothing: {
        type: [
            {
                type: String,
                trim: true,
            },
        ],
        default: [],
    },
    weatherSummary: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    temperatureCelsius: {
        type: Number,
        min: -100,
        max: 100,
    },
    indoor: {
        type: Boolean,
    },
    intelligenceType: {
        type: String,
        enum: exports.VENUE_INTELLIGENCE_TYPES,
        default: "general",
        required: true,
    },
    summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 3000,
    },
    recommendations: {
        type: [
            {
                type: String,
                trim: true,
                maxlength: 500,
            },
        ],
        default: [],
    },
    source: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
    collection: "venue_intelligence",
    versionKey: false,
});
venueIntelligenceSchema.index({
    userId: 1,
    createdAt: -1,
});
venueIntelligenceSchema.index({
    venueId: 1,
    intelligenceType: 1,
});
venueIntelligenceSchema.index({
    expiresAt: 1,
});
exports.VenueIntelligence = mongoose_1.default.models.VenueIntelligence ||
    mongoose_1.default.model("VenueIntelligence", venueIntelligenceSchema);
exports.default = exports.VenueIntelligence;
