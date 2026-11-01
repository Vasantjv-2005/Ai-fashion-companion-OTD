"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfileServiceError = void 0;
exports.getProfile = getProfile;
exports.createProfile = createProfile;
exports.updateProfile = updateProfile;
const mongoose_1 = __importDefault(require("mongoose"));
const Profile_1 = __importDefault(require("../../models/Profile"));
class ProfileServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "ProfileServiceError";
    }
}
exports.ProfileServiceError = ProfileServiceError;
function toObjectId(userId) {
    if (!mongoose_1.default.isValidObjectId(userId)) {
        throw new ProfileServiceError("Invalid user ID.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(userId);
}
async function getProfile(userId) {
    const profile = await Profile_1.default.findOne({
        userId: toObjectId(userId),
    })
        .lean()
        .exec();
    if (!profile) {
        throw new ProfileServiceError("Profile not found.", 404);
    }
    return profile;
}
async function createProfile(userId, input) {
    const userObjectId = toObjectId(userId);
    const existingProfile = await Profile_1.default.findOne({
        userId: userObjectId,
    }).exec();
    if (existingProfile) {
        throw new ProfileServiceError("A profile already exists for this user.", 409);
    }
    const profile = new Profile_1.default({
        userId: userObjectId,
        ...input,
    });
    await profile.save();
    return profile.toObject();
}
async function updateProfile(userId, input) {
    const profile = await Profile_1.default.findOneAndUpdate({ userId: toObjectId(userId) }, { $set: input }, { new: true, runValidators: true })
        .lean()
        .exec();
    if (!profile) {
        throw new ProfileServiceError("Profile not found.", 404);
    }
    return profile;
}
