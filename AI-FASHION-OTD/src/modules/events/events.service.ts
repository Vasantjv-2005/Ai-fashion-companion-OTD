import mongoose from "mongoose";
import Event from "../../models/Event";
import type {
    CreateEventInput,
    EventListOptions,
    EventResponse,
    PaginatedEventsResponse,
    UpdateEventInput,
} from "./events.types";

type EventRecord = {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    eventType: string;
    date: Date;
    location?: string;
    dressCode?: string;
    createdAt: Date;
    updatedAt: Date;
};

type EventFilter = {
    userId: mongoose.Types.ObjectId;
    eventType?: string;
    date?: {
        $gte?: Date;
        $lte?: Date;
    };
    $or?: Array<{
        title?: { $regex: string; $options: string };
        description?: { $regex: string; $options: string };
        location?: { $regex: string; $options: string };
    }>;
};

export class EventServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number
    ) {
        super(message);
        this.name = "EventServiceError";
    }
}

function assertValidObjectId(id: string, label: string): void {
    if (!mongoose.isValidObjectId(id)) {
        throw new EventServiceError(`Invalid ${label}.`, 400);
    }
}

function toEventResponse(event: EventRecord): EventResponse {
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

export async function createEvent(
    userId: string,
    input: CreateEventInput
): Promise<EventResponse> {
    assertValidObjectId(userId, "user ID");

    const event = await Event.create({
        ...input,
        userId: new mongoose.Types.ObjectId(userId),
    });

    return toEventResponse(event.toObject() as EventRecord);
}

export async function getEvents(
    userId: string,
    options: EventListOptions = {}
): Promise<PaginatedEventsResponse> {
    assertValidObjectId(userId, "user ID");

    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.min(
        100,
        Math.max(1, Math.floor(options.limit ?? 20))
    );

    const filter: EventFilter = {
        userId: new mongoose.Types.ObjectId(userId),
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
        const escapedSearch = options.search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

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
        Event.find(filter)
            .sort({ [sortBy]: sortOrder })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec(),
        Event.countDocuments(filter).exec(),
    ]);

    return {
        items: events.map((event) =>
            toEventResponse(event as unknown as EventRecord)
        ),
        pagination: {
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
        },
    };
}

export async function getEventById(
    userId: string,
    eventId: string
): Promise<EventResponse> {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");

    const event = await Event.findOne({
        _id: eventId,
        userId,
    })
        .lean()
        .exec();

    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }

    return toEventResponse(event as unknown as EventRecord);
}

export async function updateEvent(
    userId: string,
    eventId: string,
    input: UpdateEventInput
): Promise<EventResponse> {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");

    if (Object.keys(input).length === 0) {
        throw new EventServiceError(
            "At least one field must be provided for an update.",
            400
        );
    }

    const event = await Event.findOneAndUpdate(
        { _id: eventId, userId },
        { $set: input },
        {
            new: true,
            runValidators: true,
        }
    )
        .lean()
        .exec();

    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }

    return toEventResponse(event as unknown as EventRecord);
}

export async function deleteEvent(
    userId: string,
    eventId: string
): Promise<void> {
    assertValidObjectId(userId, "user ID");
    assertValidObjectId(eventId, "event ID");

    const event = await Event.findOneAndDelete({
        _id: eventId,
        userId,
    }).exec();

    if (!event) {
        throw new EventServiceError("Event not found.", 404);
    }
}
