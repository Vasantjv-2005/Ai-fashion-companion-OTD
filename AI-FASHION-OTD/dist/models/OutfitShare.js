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
exports.OutfitShare = exports.OUTFIT_SHARE_VISIBILITY = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.OUTFIT_SHARE_VISIBILITY = [
    "private",
    "followers",
    "public",
];
const outfitShareSchema = new mongoose_1.Schema({
    outfitId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Outfit",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        trim: true,
        maxlength: 150,
        default: "",
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    visibility: {
        type: String,
        enum: exports.OUTFIT_SHARE_VISIBILITY,
        default: "private",
        required: true,
    },
    shareToken: {
        type: String,
        unique: true,
        sparse: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    expiresAt: {
        type: Date,
        default: undefined,
    },
    viewCount: {
        type: Number,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
    collection: "outfit_shares",
    versionKey: false,
});
outfitShareSchema.index({ userId: 1, createdAt: -1 });
outfitShareSchema.index({ outfitId: 1, isActive: 1 });
exports.OutfitShare = mongoose_1.default.models.OutfitShare ||
    mongoose_1.default.model("OutfitShare", outfitShareSchema);
exports.default = exports.OutfitShare;
