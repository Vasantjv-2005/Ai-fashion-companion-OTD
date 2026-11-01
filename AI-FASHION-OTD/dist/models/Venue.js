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
exports.Venue = exports.VENUE_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.VENUE_TYPES = [
    "restaurant",
    "cafe",
    "office",
    "college",
    "hotel",
    "wedding_hall",
    "party_hall",
    "outdoor",
    "shopping_mall",
    "other",
];
const venueSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    venueType: {
        type: String,
        enum: exports.VENUE_TYPES,
        default: "other",
        required: true,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
    },
    city: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    state: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    country: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    latitude: {
        type: Number,
        min: -90,
        max: 90,
    },
    longitude: {
        type: Number,
        min: -180,
        max: 180,
    },
    dressCode: {
        type: String,
        trim: true,
        maxlength: 200,
    },
    indoor: {
        type: Boolean,
        default: true,
    },
    suitableOccasions: {
        type: [
            {
                type: String,
                trim: true,
                lowercase: true,
            },
        ],
        default: [],
    },
    imageUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
    },
    websiteUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    collection: "venues",
    versionKey: false,
});
venueSchema.index({
    city: 1,
    venueType: 1,
    isActive: 1,
});
venueSchema.index({
    createdBy: 1,
    createdAt: -1,
});
exports.Venue = mongoose_1.default.models.Venue ||
    mongoose_1.default.model("Venue", venueSchema);
exports.default = exports.Venue;
