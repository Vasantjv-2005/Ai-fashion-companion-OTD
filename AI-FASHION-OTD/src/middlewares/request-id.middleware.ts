
import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export interface RequestWithId extends Request {
    requestId?: string;
}

export function requestIdMiddleware(
    req: RequestWithId,
    res: Response,
    next: NextFunction,
): void {
    const requestId = randomUUID();

    req.requestId = requestId;
    res.setHeader("X-Request-ID", requestId);

    next();
}

export default requestIdMiddleware;
