export type ID = string;

export interface Timestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface PaginationOptions {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: PaginationMeta;
}

export type SortOrder = "asc" | "desc";

export interface SortOptions {
    sortBy?: string;
    sortOrder?: SortOrder;
}

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

export interface SuccessResult {
    success: true;
    message: string;
}

export interface ErrorResult {
    success: false;
    message: string;
    errors?: string[];
}

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface BaseEntity extends Timestamps {
    id: string;
}
