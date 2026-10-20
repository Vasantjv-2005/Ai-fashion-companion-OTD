
import type { Types } from "mongoose";

export interface EventAttributes {
    title: string;
    description?: string;
    eventType: string;
    date: Date;
    location?: string;
    dressCode?: string;
}

export interface CreateEventInput extends EventAttributes { }

export type UpdateEventInput = Partial<EventAttributes>;

export interface EventDocumentData extends EventAttributes {
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventResponse {
    id: string;
    userId: string;
    title: string;
    description: string;
    eventType: string;
    date: Date;
    location: string;
    dressCode: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface EventListOptions {
    page?: number;
    limit?: number;
    eventType?: string;
    fromDate?: Date;
    toDate?: Date;
    search?: string;
    sortBy?: "date" | "createdAt" | "title";
    sortOrder?: "asc" | "desc";
}

export interface PaginatedEventsResponse {
    items: EventResponse[];
    pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
    };
}
