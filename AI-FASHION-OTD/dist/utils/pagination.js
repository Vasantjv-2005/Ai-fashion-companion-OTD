"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.createPaginationMeta = createPaginationMeta;
exports.paginateArray = paginateArray;
function parsePagination(query, defaultLimit = 20, maxLimit = 100) {
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
function createPaginationMeta(total, page, limit) {
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
function paginateArray(items, page, limit) {
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
