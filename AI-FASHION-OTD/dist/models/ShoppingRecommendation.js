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
exports.ShoppingRecommendation = exports.SHOPPING_RECOMMENDATION_SOURCES = exports.SHOPPING_RECOMMENDATION_STATUSES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.SHOPPING_RECOMMENDATION_STATUSES = [
    "suggested",
    "viewed",
    "saved",
    "purchased",
    "dismissed",
];
exports.SHOPPING_RECOMMENDATION_SOURCES = [
    "ai",
    "wardrobe_gap",
    "fashion_trend",
    "manual",
];
const shoppingRecommendationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    productName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    brand: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 2000,
    },
    category: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 100,
    },
    color: {
        type: String,
        trim: true,
        lowercase: true,
    },
    style: {
        type: String,
        trim: true,
        lowercase: true,
    },
    season: {
        type: String,
        trim: true,
        lowercase: true,
    },
    productUrl: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2048,
    },
    imageUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
    },
    price: {
        type: Number,
        min: 0,
    },
    currency: {
        type: String,
        default: "INR",
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 3,
    },
    source: {
        type: String,
        enum: exports.SHOPPING_RECOMMENDATION_SOURCES,
        default: "ai",
        required: true,
    },
    status: {
        type: String,
        enum: exports.SHOPPING_RECOMMENDATION_STATUSES,
        default: "suggested",
        required: true,
    },
    recommendationReason: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    relatedWardrobeItemIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "WardrobeItem",
        },
    ],
    relatedTrendId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "FashionTrend",
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    expiresAt: {
        type: Date,
    },
}, {
    timestamps: true,
    collection: "shopping_recommendations",
    versionKey: false,
});
shoppingRecommendationSchema.index({
    userId: 1,
    status: 1,
    createdAt: -1,
});
shoppingRecommendationSchema.index({
    userId: 1,
    category: 1,
});
shoppingRecommendationSchema.index({
    expiresAt: 1,
});
exports.ShoppingRecommendation = mongoose_1.default.models.ShoppingRecommendation ||
    mongoose_1.default.model("ShoppingRecommendation", shoppingRecommendationSchema);
exports.default = exports.ShoppingRecommendation;
