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
exports.FashionTrend = exports.FASHION_TREND_CATEGORIES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.FASHION_TREND_CATEGORIES = [
    "clothing",
    "colors",
    "footwear",
    "accessories",
    "hairstyles",
    "patterns",
    "fabrics",
    "styling",
    "other",
];
const fashionTrendSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
    },
    slug: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        maxlength: 180,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000,
    },
    category: {
        type: String,
        enum: exports.FASHION_TREND_CATEGORIES,
        required: true,
    },
    season: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50,
        default: "all-season",
    },
    year: {
        type: Number,
        min: 2000,
        max: 2100,
        default: () => new Date().getFullYear(),
    },
    colors: {
        type: [String],
        default: [],
    },
    tags: {
        type: [String],
        default: [],
    },
    imageUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: undefined,
    },
    sourceName: {
        type: String,
        trim: true,
        maxlength: 150,
        default: undefined,
    },
    sourceUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        default: undefined,
    },
    popularityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    startsAt: {
        type: Date,
        default: undefined,
    },
    endsAt: {
        type: Date,
        default: undefined,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
    collection: "fashion_trends",
    versionKey: false,
});
fashionTrendSchema.index({ category: 1, isActive: 1 });
fashionTrendSchema.index({ year: -1, popularityScore: -1 });
exports.FashionTrend = mongoose_1.default.models.FashionTrend ||
    mongoose_1.default.model("FashionTrend", fashionTrendSchema);
exports.default = exports.FashionTrend;
