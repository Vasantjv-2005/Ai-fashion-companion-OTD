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
exports.WardrobeItem = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const wardrobe_types_1 = require("../modules/wardrobe/wardrobe.types");
const wardrobeItemSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 100,
    },
    category: {
        type: String,
        enum: [...wardrobe_types_1.CLOTHING_CATEGORIES],
        required: true,
        index: true,
    },
    color: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
    },
    style: {
        type: String,
        enum: [...wardrobe_types_1.CLOTHING_STYLES],
        required: true,
        index: true,
    },
    season: {
        type: [{
                type: String,
                enum: [...wardrobe_types_1.CLOTHING_SEASONS],
            }],
        required: true,
        validate: {
            validator: (seasons) => seasons.length > 0 &&
                new Set(seasons).size === seasons.length,
            message: "At least one unique season is required.",
        },
    },
    brand: {
        type: String,
        trim: true,
        maxlength: 100,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 1000,
    },
    imageFileId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: undefined,
    },
}, {
    timestamps: true,
    versionKey: false,
    collection: "wardrobe_items",
});
wardrobeItemSchema.index({
    userId: 1,
    createdAt: -1,
});
wardrobeItemSchema.index({
    userId: 1,
    category: 1,
});
wardrobeItemSchema.index({
    userId: 1,
    name: 1,
});
exports.WardrobeItem = mongoose_1.default.models.WardrobeItem ??
    mongoose_1.default.model("WardrobeItem", wardrobeItemSchema);
exports.default = exports.WardrobeItem;
