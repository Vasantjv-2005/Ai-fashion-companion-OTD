import type { PaginationMeta, PaginatedResult } from "../types/common.types";

export interface ParsedPagination {
    page: number;
    limit: number;
    skip: number;
}

export function parsePagination(
    query: { page?: unknown; limit?: unknown },
    defaultLimit = 20,
    maxLimit = 100,
): ParsedPagination {
    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);

    const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
    let limit = Number.isInteger(rawLimit) && rawLimit >= 1 ? rawLimit : defaultLimit;

    if (limit > maxLimit) {
        limit = maxLimit;
    }

    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

export function createPaginationMeta(
    total: number,
    page: number,
    limit: number,
): PaginationMeta {
    const safeTotal = Math.max(0, total);
    const safeLimit = Math.max(1, limit);
    const totalPages = Math.ceil(safeTotal / safeLimit);

    return {
        page,
        limit: safeLimit,
        total: safeTotal,
        totalPages,
    };
}

export function paginateArray<T>(
    items: T[],
    page: number,
    limit: number,
): PaginatedResult<T> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const total = items.length;
    const skip = (safePage - 1) * safeLimit;
    const data = items.slice(skip, skip + safeLimit);

    return {
        data,
        pagination: createPaginationMeta(total, safePage, safeLimit),
    };
}

