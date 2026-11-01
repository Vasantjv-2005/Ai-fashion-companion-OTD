import mongoose from "mongoose";
import OutfitShare from "../../models/OutfitShare";
import Outfit from "../../models/Outfit";
import SocialLike from "../../models/SocialLike";
import SocialComment from "../../models/SocialComment";
import User from "../../models/User";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type { ShareOutfitDto, AddCommentDto, SocialFeedQueryDto } from "./social.validator";

export class SocialServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "SocialServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new SocialServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function shareOutfit(userId: string, input: ShareOutfitDto) {
    const userObjectId = toObjectId(userId);
    const outfitObjectId = toObjectId(input.outfitId);

    const outfit = await Outfit.findOne({
        _id: outfitObjectId,
        userId: userObjectId,
    }).exec();

    if (!outfit) {
        throw new SocialServiceError("Outfit not found or access denied.", 404);
    }

    const share = await OutfitShare.create({
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

export async function getSocialFeed(
    currentUserId?: string,
    query: SocialFeedQueryDto = { page: 1, limit: 20 },
) {
    const { page, limit, skip } = parsePagination(query, 20, 50);

    const filter: Record<string, unknown> = {
        visibility: "public",
        isActive: true,
    };

    const [shares, total] = await Promise.all([
        OutfitShare.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("userId", "name")
            .populate("outfitId")
            .lean()
            .exec(),
        OutfitShare.countDocuments(filter).exec(),
    ]);

    const postIds = shares.map((s) => s._id);

    // Fetch likes and comments counts
    const [likesCounts, commentsCounts, userLikes] = await Promise.all([
        SocialLike.aggregate([
            { $match: { postId: { $in: postIds } } },
            { $group: { _id: "$postId", count: { $sum: 1 } } },
        ]).exec(),
        SocialComment.aggregate([
            { $match: { postId: { $in: postIds }, isDeleted: false } },
            { $group: { _id: "$postId", count: { $sum: 1 } } },
        ]).exec(),
        currentUserId && mongoose.isValidObjectId(currentUserId)
            ? SocialLike.find({
                  userId: new mongoose.Types.ObjectId(currentUserId),
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
        authorName: (share.userId as unknown as { name?: string })?.name || "Fashion Enthusiast",
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
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function getShareById(shareId: string, currentUserId?: string) {
    const shareObjectId = toObjectId(shareId);

    const share = await OutfitShare.findByIdAndUpdate(
        shareObjectId,
        { $inc: { viewCount: 1 } },
        { new: true },
    )
        .populate("userId", "name")
        .populate("outfitId")
        .lean()
        .exec();

    if (!share || !share.isActive) {
        throw new SocialServiceError("Outfit share not found.", 404);
    }

    const [likeCount, commentCount, userLiked] = await Promise.all([
        SocialLike.countDocuments({ postId: shareObjectId }).exec(),
        SocialComment.countDocuments({ postId: shareObjectId, isDeleted: false }).exec(),
        currentUserId && mongoose.isValidObjectId(currentUserId)
            ? SocialLike.exists({
                  postId: shareObjectId,
                  userId: new mongoose.Types.ObjectId(currentUserId),
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

export async function toggleLikePost(userId: string, postId: string) {
    const userObjectId = toObjectId(userId);
    const postObjectId = toObjectId(postId);

    const existing = await SocialLike.findOneAndDelete({
        userId: userObjectId,
        postId: postObjectId,
    }).exec();

    if (existing) {
        return { liked: false, message: "Unliked post." };
    }

    await SocialLike.create({
        userId: userObjectId,
        postId: postObjectId,
    });

    return { liked: true, message: "Liked post." };
}

export async function addCommentToPost(
    userId: string,
    postId: string,
    input: AddCommentDto,
) {
    const userObjectId = toObjectId(userId);
    const postObjectId = toObjectId(postId);

    const post = await OutfitShare.findOne({ _id: postObjectId, isActive: true }).exec();
    if (!post) {
        throw new SocialServiceError("Post not found.", 404);
    }

    const comment = await SocialComment.create({
        userId: userObjectId,
        postId: postObjectId,
        parentCommentId: input.parentCommentId ? toObjectId(input.parentCommentId) : undefined,
        content: input.content,
    });

    return comment.toObject();
}

export async function getPostComments(postId: string) {
    const postObjectId = toObjectId(postId);

    return SocialComment.find({ postId: postObjectId, isDeleted: false })
        .sort({ createdAt: 1 })
        .populate("userId", "name")
        .lean()
        .exec();
}

export async function deleteShare(userId: string, shareId: string) {
    const userObjectId = toObjectId(userId);
    const shareObjectId = toObjectId(shareId);

    const share = await OutfitShare.findOneAndUpdate(
        { _id: shareObjectId, userId: userObjectId },
        { $set: { isActive: false } },
    ).exec();

    if (!share) {
        throw new SocialServiceError("Share not found or access denied.", 404);
    }

    return { success: true, message: "Outfit share removed." };
}

