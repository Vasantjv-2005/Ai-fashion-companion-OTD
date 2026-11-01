"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialServiceError = void 0;
exports.shareOutfit = shareOutfit;
exports.getSocialFeed = getSocialFeed;
exports.getShareById = getShareById;
exports.toggleLikePost = toggleLikePost;
exports.addCommentToPost = addCommentToPost;
exports.getPostComments = getPostComments;
exports.deleteShare = deleteShare;
const mongoose_1 = __importDefault(require("mongoose"));
const OutfitShare_1 = __importDefault(require("../../models/OutfitShare"));
const Outfit_1 = __importDefault(require("../../models/Outfit"));
const SocialLike_1 = __importDefault(require("../../models/SocialLike"));
const SocialComment_1 = __importDefault(require("../../models/SocialComment"));
const pagination_1 = require("../../utils/pagination");
class SocialServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "SocialServiceError";
    }
}
exports.SocialServiceError = SocialServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new SocialServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function shareOutfit(userId, input) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(input.outfitId);
    const outfit = await Outfit_1.default.findOne({
        _id: outfitObjectId,
        userId: userObjectId,
    }).exec();
    if (!outfit) {
        throw new SocialServiceError("Outfit not found or access denied.", 404);
    }
    const share = await OutfitShare_1.default.create({
        userId: userObjectId,
        outfitId: outfitObjectId,
        title: input.title || outfit.name,
        description: input.description || outfit.description,
        visibility: input.visibility,
        expiresAt: input.expiresAt,
        isActive: true,
    });
    return share.toObject();
}
async function getSocialFeed(currentUserId, query = { page: 1, limit: 20 }) {
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 20, 50);
    const filter = {
        visibility: "public",
        isActive: true,
    };
    const [shares, total] = await Promise.all([
        OutfitShare_1.default.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name")
            .populate("outfitId")
            .lean()
            .exec(),
        OutfitShare_1.default.countDocuments(filter).exec(),
    ]);
    const postIds = shares.map((s) => s._id);
    // Fetch likes and comments counts
    const [likesCounts, commentsCounts, userLikes] = await Promise.all([
        SocialLike_1.default.aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: "$postId", count: { $sum: 1 } } },
        ]).exec(),
        SocialComment_1.default.aggregate([
            { $match: { postId: { $in: postIds }, isDeleted: false } },
            { $group: { _id: "$postId", count: { $sum: 1 } } },
        ]).exec(),
        currentUserId && mongoose_1.default.isValidObjectId(currentUserId)
            ? SocialLike_1.default.find({
                userId: new mongoose_1.default.Types.ObjectId(currentUserId),
                postId: { $in: postIds },
            })
                .select("postId")
                .lean()
                .exec()
            : Promise.resolve([]),
    ]);
    const likesMap = new Map(likesCounts.map((l) => [String(l._id), l.count]));
    const commentsMap = new Map(commentsCounts.map((c) => [String(c._id), c.count]));
    const userLikesSet = new Set(userLikes.map((ul) => String(ul.postId)));
    const feed = shares.map((share) => ({
        id: String(share._id),
        outfitId: String(share.outfitId?._id || share.outfitId),
        outfit: share.outfitId,
        userId: String(share.userId?._id || share.userId),
        authorName: share.userId?.name || "Fashion Enthusiast",
        title: share.title,
        description: share.description,
        visibility: share.visibility,
        viewCount: share.viewCount,
        likeCount: likesMap.get(String(share._id)) || 0,
        commentCount: commentsMap.get(String(share._id)) || 0,
        isLikedByCurrentUser: userLikesSet.has(String(share._id)),
        createdAt: share.createdAt,
    }));
    return {
        feed,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function getShareById(shareId, currentUserId) {
    const shareObjectId = toObjectId(shareId);
    const share = await OutfitShare_1.default.findByIdAndUpdate(shareObjectId, { $inc: { viewCount: 1 } }, { new: true })
        .populate("userId", "name")
        .populate("outfitId")
        .lean()
        .exec();
    if (!share || !share.isActive) {
        throw new SocialServiceError("Outfit share not found.", 404);
    }
    const [likeCount, commentCount, userLiked] = await Promise.all([
        SocialLike_1.default.countDocuments({ postId: shareObjectId }).exec(),
        SocialComment_1.default.countDocuments({ postId: shareObjectId, isDeleted: false }).exec(),
        currentUserId && mongoose_1.default.isValidObjectId(currentUserId)
            ? SocialLike_1.default.exists({
                postId: shareObjectId,
                userId: new mongoose_1.default.Types.ObjectId(currentUserId),
            }).exec()
            : Promise.resolve(null),
    ]);
    return {
        ...share,
        likeCount,
        commentCount,
        isLikedByCurrentUser: Boolean(userLiked),
    };
}
async function toggleLikePost(userId, postId) {
    const userObjectId = toObjectId(userId);
    const postObjectId = toObjectId(postId);
    const existing = await SocialLike_1.default.findOneAndDelete({
        userId: userObjectId,
        postId: postObjectId,
    }).exec();
    if (existing) {
        return { liked: false, message: "Unliked post." };
    }
    await SocialLike_1.default.create({
        userId: userObjectId,
        postId: postObjectId,
    });
    return { liked: true, message: "Liked post." };
}
async function addCommentToPost(userId, postId, input) {
    const userObjectId = toObjectId(userId);
    const postObjectId = toObjectId(postId);
    const post = await OutfitShare_1.default.findOne({ _id: postObjectId, isActive: true }).exec();
    if (!post) {
        throw new SocialServiceError("Post not found.", 404);
    }
    const comment = await SocialComment_1.default.create({
        userId: userObjectId,
        postId: postObjectId,
        parentCommentId: input.parentCommentId ? toObjectId(input.parentCommentId) : undefined,
        content: input.content,
    });
    return comment.toObject();
}
async function getPostComments(postId) {
    const postObjectId = toObjectId(postId);
    return SocialComment_1.default.find({ postId: postObjectId, isDeleted: false })
        .sort({ createdAt: 1 })
        .populate("userId", "name")
        .lean()
        .exec();
}
async function deleteShare(userId, shareId) {
    const userObjectId = toObjectId(userId);
    const shareObjectId = toObjectId(shareId);
    const share = await OutfitShare_1.default.findOneAndUpdate({ _id: shareObjectId, userId: userObjectId }, { $set: { isActive: false } }).exec();
    if (!share) {
        throw new SocialServiceError("Share not found or access denied.", 404);
    }
    return { success: true, message: "Outfit share removed." };
}
