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
exports.GroupEvent = exports.GROUP_EVENT_VISIBILITY = exports.GROUP_EVENT_TYPES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.GROUP_EVENT_TYPES = [
    "party",
    "wedding",
    "birthday",
    "travel",
    "work",
    "festival",
    "photoshoot",
    "casual",
    "other",
];
exports.GROUP_EVENT_VISIBILITY = [
    "private",
    "invite-only",
    "public",
];
const groupEventSchema = new mongoose_1.Schema({
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
        maxlength: 2000,
        default: "",
    },
    eventType: {
        type: String,
        enum: exports.GROUP_EVENT_TYPES,
        default: "other",
        required: true,
    },
    startsAt: {
        type: Date,
        required: true,
    },
    endsAt: {
        type: Date,
        default: undefined,
    },
    location: {
        type: String,
        trim: true,
        maxlength: 200,
        default: "",
    },
    venueId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Venue",
        default: undefined,
    },
    dressCode: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "casual",
    },
    visibility: {
        type: String,
        enum: exports.GROUP_EVENT_VISIBILITY,
        default: "invite-only",
        required: true,
    },
    maxMembers: {
        type: Number,
        min: 2,
        max: 1000,
        default: 20,
    },
    isCancelled: {
        type: Boolean,
        default: false,
    },
    cancelledAt: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
    collection: "group_events",
    versionKey: false,
});
groupEventSchema.index({ creatorId: 1, startsAt: 1 });
groupEventSchema.index({ visibility: 1, startsAt: 1 });
exports.GroupEvent = mongoose_1.default.models.GroupEvent ||
    mongoose_1.default.model("GroupEvent", groupEventSchema);
exports.default = exports.GroupEvent;
