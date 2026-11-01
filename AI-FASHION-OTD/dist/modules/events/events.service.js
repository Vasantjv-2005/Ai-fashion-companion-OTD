"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventServiceError = void 0;
exports.createEvent = createEvent;
exports.getEvents = getEvents;
exports.getEventById = getEventById;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;
const mongoose_1 = __importDefault(require("mongoose"));
const Event_1 = __importDefault(require("../../models/Event"));
class EventServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "EventServiceError";
    }
}
exports.EventServiceError = EventServiceError;
function assertValidObjectId(id, label) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new EventServiceError(`Invalid ${label}.`, 400);
    }
}
function toEventResponse(event) {
    return {
        id: event._id.toString(),
        userId: event.userId.toString(),
        title: event.title,
        description: event.description ?? "",
        eventType: event.eventType,
        date: event.date,
        location: event.location ?? "",
        dressCode: event.dressCode ?? "casual",
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
    };
}
async function createEvent(userId, input) {
    assertValidObjectId(userId, "user ID");
    const event = await Event_1.default.create({
        ...input,
        userId: new mongoose_1.default.Types.ObjectId(userId),
    });
    return toEventResponse(event.toObject());
}
async function getEvents(userId, options = {}) {
    assertValidObjectId(userId, "user ID");
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(100, Math.max(1, Math.floor(options.limit ?? 20)));
    const filter = {
        userId: new mongoose_1.default.Types.ObjectId(userId),
    };
    if (options.eventType) {
        filter.eventType = options.eventType;
    }
    if (options.fromDate || options.toDate) {
        filter.date = {};
        if (options.fromDate) {
            filter.date.$gte = options.fromDate;
        }
        if (options.toDate) {
            filter.date.$lte = options.toDate;
        }
    }
    if (options.search) {
        const escapedSearch = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [
            { title: { $regex: escapedSearch, $options: "i" } },
            {
                description: {
                    $regex: escapedSearch,
                    $options: "i",
                },
            },
            { location: { $regex: escapedSearch, $options: "i" } },
        ];
    }
    const sortBy = options.sortBy ?? "date";
    const sortOrder = options.sortOrder === "desc" ? -1 : 1;
    const [events, totalItems] = await Promise.all([
        Event_1.default.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),
        Event_1.default.countDocuments(filter).exec(),
    ]);
    return {
        items: events.map((event) => toEventResponse(event)),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}
async function getEventById(userId, eventId) {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");
    const event = await Event_1.default.findOne({
        _id: eventId,
        userId,
    })
        .lean()
        .exec();
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    return toEventResponse(event);
}
async function updateEvent(userId, eventId, input) {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");
    if (Object.keys(input).length === 0) {
        throw new EventServiceError("At least one field must be provided for an update.", 400);
    }
    const event = await Event_1.default.findOneAndUpdate({ _id: eventId, userId }, { $set: input }, {
        new: true,
        runValidators: true,
    })
        .lean()
        .exec();
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
    return toEventResponse(event);
}
async function deleteEvent(userId, eventId) {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");
    const event = await Event_1.default.findOneAndDelete({
        _id: eventId,
        userId,
    }).exec();
    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
}
