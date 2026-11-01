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
exports.OutfitPoll = exports.OUTFIT_POLL_VISIBILITY = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.OUTFIT_POLL_VISIBILITY = [
    "private",
    "followers",
    "public",
];
const outfitPollSchema = new mongoose_1.Schema({
    creatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 150,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
    },
    visibility: {
        type: String,
        enum: exports.OUTFIT_POLL_VISIBILITY,
        default: "private",
        required: true,
    },
    allowMultipleVotes: {
        type: Boolean,
        default: false,
    },
    endsAt: {
        type: Date,
        default: undefined,
    },
    isClosed: {
        type: Boolean,
        default: false,
    },
    closedAt: {
        type: Date,
        default: undefined,
    },
    totalVotes: {
        type: Number,
        min: 0,
        default: 0,
    },
}, {
    timestamps: true,
    collection: "outfit_polls",
    versionKey: false,
});
outfitPollSchema.index({ creatorId: 1, createdAt: -1 });
outfitPollSchema.index({ isClosed: 1, endsAt: 1 });
exports.OutfitPoll = mongoose_1.default.models.OutfitPoll ||
    mongoose_1.default.model("OutfitPoll", outfitPollSchema);
exports.default = exports.OutfitPoll;
