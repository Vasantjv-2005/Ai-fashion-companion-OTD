"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupServiceError = void 0;
exports.createGroupEvent = createGroupEvent;
exports.getGroupEvents = getGroupEvents;
exports.getGroupEventById = getGroupEventById;
exports.updateGroupEvent = updateGroupEvent;
exports.updateMemberRsvp = updateMemberRsvp;
exports.createPoll = createPoll;
exports.getPollById = getPollById;
exports.voteOnPoll = voteOnPoll;
const mongoose_1 = __importDefault(require("mongoose"));
const GroupEvent_1 = __importDefault(require("../../models/GroupEvent"));
const GroupEventMember_1 = __importDefault(require("../../models/GroupEventMember"));
const OutfitPoll_1 = __importDefault(require("../../models/OutfitPoll"));
const OutfitPollOption_1 = __importDefault(require("../../models/OutfitPollOption"));
const OutfitPollVote_1 = __importDefault(require("../../models/OutfitPollVote"));
const pagination_1 = require("../../utils/pagination");
class GroupServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "GroupServiceError";
    }
}
exports.GroupServiceError = GroupServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new GroupServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
// ----------------- GROUP EVENTS -----------------
async function createGroupEvent(userId, input) {
    const userObjectId = toObjectId(userId);
    const event = new GroupEvent_1.default({
        ...input,
        creatorId: userObjectId,
    });
    await event.save();
    // Add creator as accepted organizer
    await GroupEventMember_1.default.create({
        groupEventId: event._id,
        userId: userObjectId,
        role: "organizer",
        status: "accepted",
        rsvp: "attending",
        joinedAt: new Date(),
    });
    return event.toObject();
}
async function getGroupEvents(userId, query = {}) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = (0, pagination_1.parsePagination)(query, 10, 50);
    // Get events created by user or where user is member
    const memberships = await GroupEventMember_1.default.find({
        userId: userObjectId,
        status: { $in: ["accepted", "invited"] },
    })
        .select("groupEventId")
        .lean()
        .exec();
    const eventIds = memberships.map((m) => m.groupEventId);
    const filter = {
        $or: [{ creatorId: userObjectId }, { _id: { $in: eventIds } }],
        isCancelled: false,
    };
    const [events, total] = await Promise.all([
        GroupEvent_1.default.find(filter).sort({ startsAt: 1 }).skip(skip).limit(limit).lean().exec(),
        GroupEvent_1.default.countDocuments(filter).exec(),
    ]);
    return {
        events,
        pagination: (0, pagination_1.createPaginationMeta)(total, page, limit),
    };
}
async function getGroupEventById(userId, eventId) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);
    const event = await GroupEvent_1.default.findById(eventObjectId).lean().exec();
    if (!event) {
        throw new GroupServiceError("Group event not found.", 404);
    }
    const members = await GroupEventMember_1.default.find({ groupEventId: eventObjectId })
        .populate("userId", "name email")
        .lean()
        .exec();
    return {
        ...event,
        members,
    };
}
async function updateGroupEvent(userId, eventId, input) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);
    const event = await GroupEvent_1.default.findOne({
        _id: eventObjectId,
        creatorId: userObjectId,
    }).exec();
    if (!event) {
        throw new GroupServiceError("Group event not found or access denied.", 404);
    }
    Object.assign(event, input);
    if (input.isCancelled) {
        event.cancelledAt = new Date();
    }
    await event.save();
    return event.toObject();
}
async function updateMemberRsvp(userId, eventId, rsvp) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);
    const member = await GroupEventMember_1.default.findOneAndUpdate({ groupEventId: eventObjectId, userId: userObjectId }, {
        $set: {
            rsvp,
            status: "accepted",
            respondedAt: new Date(),
        },
    }, { new: true })
        .lean()
        .exec();
    if (!member) {
        throw new GroupServiceError("Membership record not found.", 404);
    }
    return member;
}
// ----------------- OUTFIT POLLS -----------------
async function createPoll(userId, input) {
    const userObjectId = toObjectId(userId);
    const poll = await OutfitPoll_1.default.create({
        creatorId: userObjectId,
        title: input.title,
        description: input.description,
        visibility: input.visibility,
        allowMultipleVotes: input.allowMultipleVotes,
        endsAt: input.endsAt,
    });
    const optionDocs = input.options.map((opt, idx) => ({
        pollId: poll._id,
        label: opt.label,
        outfitId: opt.outfitId ? toObjectId(opt.outfitId) : undefined,
        wardrobeItemIds: (opt.wardrobeItemIds || []).map((id) => toObjectId(id)),
        description: opt.description,
        position: idx,
    }));
    const options = await OutfitPollOption_1.default.insertMany(optionDocs);
    return {
        ...poll.toObject(),
        options,
    };
}
async function getPollById(userId, pollId) {
    const pollObjectId = toObjectId(pollId);
    const poll = await OutfitPoll_1.default.findById(pollObjectId).lean().exec();
    if (!poll) {
        throw new GroupServiceError("Poll not found.", 404);
    }
    const options = await OutfitPollOption_1.default.find({ pollId: pollObjectId })
        .sort({ position: 1 })
        .lean()
        .exec();
    return {
        ...poll,
        options,
    };
}
async function voteOnPoll(userId, pollId, optionId) {
    const userObjectId = toObjectId(userId);
    const pollObjectId = toObjectId(pollId);
    const optionObjectId = toObjectId(optionId);
    const poll = await OutfitPoll_1.default.findById(pollObjectId).exec();
    if (!poll) {
        throw new GroupServiceError("Poll not found.", 404);
    }
    if (poll.isClosed || (poll.endsAt && poll.endsAt < new Date())) {
        throw new GroupServiceError("This poll is closed.", 400);
    }
    const option = await OutfitPollOption_1.default.findOne({
        _id: optionObjectId,
        pollId: pollObjectId,
    }).exec();
    if (!option) {
        throw new GroupServiceError("Invalid poll option.", 404);
    }
    // Check existing vote
    const existingVote = await OutfitPollVote_1.default.findOne({
        pollId: pollObjectId,
        userId: userObjectId,
    }).exec();
    if (existingVote && !poll.allowMultipleVotes) {
        throw new GroupServiceError("You have already voted on this poll.", 409);
    }
    await OutfitPollVote_1.default.create({
        pollId: pollObjectId,
        optionId: optionObjectId,
        userId: userObjectId,
        votedAt: new Date(),
    });
    option.voteCount += 1;
    await option.save();
    poll.totalVotes += 1;
    await poll.save();
    return {
        success: true,
        message: "Vote recorded successfully.",
        totalVotes: poll.totalVotes,
    };
}
