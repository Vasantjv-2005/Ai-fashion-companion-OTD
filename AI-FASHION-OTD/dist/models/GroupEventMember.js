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
exports.GroupEventMember = exports.GROUP_MEMBER_RSVP = exports.GROUP_MEMBER_STATUSES = exports.GROUP_MEMBER_ROLES = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.GROUP_MEMBER_ROLES = [
    "organizer",
    "member",
];
exports.GROUP_MEMBER_STATUSES = [
    "invited",
    "accepted",
    "declined",
    "removed",
];
exports.GROUP_MEMBER_RSVP = [
    "pending",
    "attending",
    "not-attending",
    "maybe",
];
const groupEventMemberSchema = new mongoose_1.Schema({
    groupEventId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "GroupEvent",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: exports.GROUP_MEMBER_ROLES,
        default: "member",
        required: true,
    },
    status: {
        type: String,
        enum: exports.GROUP_MEMBER_STATUSES,
        default: "invited",
        required: true,
    },
    rsvp: {
        type: String,
        enum: exports.GROUP_MEMBER_RSVP,
        default: "pending",
        required: true,
    },
    invitedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        default: undefined,
    },
    invitedAt: {
        type: Date,
        default: Date.now,
    },
    respondedAt: {
        type: Date,
        default: undefined,
    },
    joinedAt: {
        type: Date,
        default: undefined,
    },
}, {
    timestamps: true,
    collection: "group_event_members",
    versionKey: false,
});
// A user can have only one membership record per group event.
groupEventMemberSchema.index({ groupEventId: 1, userId: 1 }, { unique: true });
groupEventMemberSchema.index({ userId: 1, status: 1 });
exports.GroupEventMember = mongoose_1.default.models.GroupEventMember ||
    mongoose_1.default.model("GroupEventMember", groupEventMemberSchema);
exports.default = exports.GroupEventMember;
