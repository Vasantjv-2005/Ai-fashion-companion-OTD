import type { PaginationMeta } from "./common.types";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: unknown;
    meta?: Record<string, unknown> | PaginationMeta;
}

export interface ApiSuccessResponse<T = unknown> {
    success: true;
    data: T;
    message?: string;
    meta?: Record<string, unknown> | PaginationMeta;
}

export interface ApiErrorResponse {
    success: false;
    message: string;
    errors?: unknown;
    debug?: Record<string, unknown>;
}

export interface PaginatedApiResponse<T = unknown> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
    message?: string;
}

export interface QueryParams {
    page?: number | string;
    limit?: number | string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    search?: string;
}

export type HttpStatusCode =
    | 200
    | 201
    | 204
    | 400
    | 401
    | 403
    | 404
    | 409
    | 413
    | 415
    | 422
    | 429
    | 500
    | 502
    | 503
    | 504;

