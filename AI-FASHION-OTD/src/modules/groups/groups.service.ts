import mongoose from "mongoose";
import GroupEvent from "../../models/GroupEvent";
import GroupEventMember from "../../models/GroupEventMember";
import OutfitPoll from "../../models/OutfitPoll";
import OutfitPollOption from "../../models/OutfitPollOption";
import OutfitPollVote from "../../models/OutfitPollVote";
import { parsePagination, createPaginationMeta } from "../../utils/pagination";
import type {
    CreateGroupEventDto,
    UpdateGroupEventDto,
    CreatePollDto,
} from "./groups.validator";

export class GroupServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "GroupServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new GroupServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

// ----------------- GROUP EVENTS -----------------

export async function createGroupEvent(
    userId: string,
    input: CreateGroupEventDto,
) {
    const userObjectId = toObjectId(userId);

    const event = new GroupEvent({
        ...input,
        creatorId: userObjectId,
    });

    await event.save();

    // Add creator as accepted organizer
    await GroupEventMember.create({
        groupEventId: event._id,
        userId: userObjectId,
        role: "organizer",
        status: "accepted",
        rsvp: "attending",
        joinedAt: new Date(),
    });

    return event.toObject();
}

export async function getGroupEvents(
    userId: string,
    query: { page?: number | string; limit?: number | string } = {},
) {
    const userObjectId = toObjectId(userId);
    const { page, limit, skip } = parsePagination(query, 10, 50);

    // Get events created by user or where user is member
    const memberships = await GroupEventMember.find({
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
        GroupEvent.find(filter).sort({ startsAt: 1 }).skip(skip).limit(limit).lean().exec(),
        GroupEvent.countDocuments(filter).exec(),
    ]);

    return {
        events,
        pagination: createPaginationMeta(total, page, limit),
    };
}

export async function getGroupEventById(userId: string, eventId: string) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);

    const event = await GroupEvent.findById(eventObjectId).lean().exec();
    if (!event) {
        throw new GroupServiceError("Group event not found.", 404);
    }

    const members = await GroupEventMember.find({ groupEventId: eventObjectId })
        .populate("userId", "name email")
        .lean()
        .exec();

    return {
        ...event,
        members,
    };
}

export async function updateGroupEvent(
    userId: string,
    eventId: string,
    input: UpdateGroupEventDto,
) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);

    const event = await GroupEvent.findOne({
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

export async function updateMemberRsvp(
    userId: string,
    eventId: string,
    rsvp: "pending" | "attending" | "not-attending" | "maybe",
) {
    const userObjectId = toObjectId(userId);
    const eventObjectId = toObjectId(eventId);

    const member = await GroupEventMember.findOneAndUpdate(
        { groupEventId: eventObjectId, userId: userObjectId },
        {
            $set: {
                rsvp,
                status: "accepted",
                respondedAt: new Date(),
            },
        },
        { new: true },
    )
        .lean()
        .exec();

    if (!member) {
        throw new GroupServiceError("Membership record not found.", 404);
    }

    return member;
}

// ----------------- OUTFIT POLLS -----------------

export async function createPoll(userId: string, input: CreatePollDto) {
    const userObjectId = toObjectId(userId);

    const poll = await OutfitPoll.create({
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

    const options = await OutfitPollOption.insertMany(optionDocs);

    return {
        ...poll.toObject(),
        options,
    };
}

export async function getPollById(userId: string, pollId: string) {
    const pollObjectId = toObjectId(pollId);

    const poll = await OutfitPoll.findById(pollObjectId).lean().exec();
    if (!poll) {
        throw new GroupServiceError("Poll not found.", 404);
    }

    const options = await OutfitPollOption.find({ pollId: pollObjectId })
        .sort({ position: 1 })
        .lean()
        .exec();

    return {
        ...poll,
        options,
    };
}

export async function voteOnPoll(
    userId: string,
    pollId: string,
    optionId: string,
) {
    const userObjectId = toObjectId(userId);
    const pollObjectId = toObjectId(pollId);
    const optionObjectId = toObjectId(optionId);

    const poll = await OutfitPoll.findById(pollObjectId).exec();
    if (!poll) {
        throw new GroupServiceError("Poll not found.", 404);
    }

    if (poll.isClosed || (poll.endsAt && poll.endsAt < new Date())) {
        throw new GroupServiceError("This poll is closed.", 400);
    }

    const option = await OutfitPollOption.findOne({
        _id: optionObjectId,
        pollId: pollObjectId,
    }).exec();

    if (!option) {
        throw new GroupServiceError("Invalid poll option.", 404);
    }

    // Check existing vote
    const existingVote = await OutfitPollVote.findOne({
        pollId: pollObjectId,
        userId: userObjectId,
    }).exec();

    if (existingVote && !poll.allowMultipleVotes) {
        throw new GroupServiceError("You have already voted on this poll.", 409);
    }

    await OutfitPollVote.create({
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

