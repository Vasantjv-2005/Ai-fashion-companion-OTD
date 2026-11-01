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
exports.OutfitGeneration = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GENERATION_STATUSES = [
    "pending",
    "processing",
    "completed",
    "failed",
];
const outfitGenerationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    occasion: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 100,
        default: "casual",
    },
    requestedStyle: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 100,
        default: "casual",
    },
    season: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 50,
        default: "all-season",
    },
    wardrobeItemIds: {
        type: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "WardrobeItem",
            },
        ],
        default: [],
    },
    generatedOutfits: {
        type: [
            {
                name: {
                    type: String,
                    trim: true,
                    maxlength: 100,
                },
                description: {
                    type: String,
                    trim: true,
                    maxlength: 1000,
                },
                wardrobeItemIds: [
                    {
                        type: mongoose_1.Schema.Types.ObjectId,
                        ref: "WardrobeItem",
                    },
                ],
                style: {
                    type: String,
                    trim: true,
                    maxlength: 100,
                },
                explanation: {
                    type: String,
                    trim: true,
                    maxlength: 2000,
                },
                score: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
            },
        ],
        default: [],
    },
    status: {
        type: String,
        enum: GENERATION_STATUSES,
        default: "pending",
        required: true,
    },
    aiProvider: {
        type: String,
        trim: true,
        maxlength: 100,
        default: undefined,
    },
    modelName: {
        type: String,
        trim: true,
        maxlength: 100,
        default: undefined,
    },
    promptVersion: {
        type: String,
        trim: true,
        maxlength: 50,
        default: undefined,
    },
    errorMessage: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: undefined,
    },
    generatedAt: {
        type: Date,
        default: undefined,
    },
    processingTimeMs: {
        type: Number,
        min: 0,
        default: undefined,
    },
}, {
    timestamps: true,
    collection: "outfit_generations",
    versionKey: false,
});
outfitGenerationSchema.index({ userId: 1, createdAt: -1 });
outfitGenerationSchema.index({ userId: 1, status: 1 });
exports.OutfitGeneration = mongoose_1.default.models.OutfitGeneration ||
    mongoose_1.default.model("OutfitGeneration", outfitGenerationSchema);
exports.default = exports.OutfitGeneration;
