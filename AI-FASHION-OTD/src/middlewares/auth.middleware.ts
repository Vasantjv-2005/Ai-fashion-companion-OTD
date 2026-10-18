
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import type { JwtAccessTokenPayload } from "../modules/auth/auth.types";
import type { AuthenticatedRequestUser } from "../modules/auth/auth.types";

function getAccessTokenSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET is missing or invalid.");
    }

    return secret;
}

function isAccessTokenPayload(
    payload: string | jwt.JwtPayload,
): payload is jwt.JwtPayload & JwtAccessTokenPayload {
    return (
        typeof payload !== "string" &&
        typeof payload.sub === "string" &&
        typeof payload.email === "string" &&
        payload.type === "access"
    );
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedRequestUser;
}

export function authMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return;
    }

    try {
        const payload = jwt.verify(
            token,
            getAccessTokenSecret(),
            { algorithms: ["HS256"] },
        );

        if (!isAccessTokenPayload(payload)) {
            res.status(401).json({
                success: false,
                message: "Invalid access token.",
            });
            return;
        }

        req.user = {
            id: payload.sub,
            email: payload.email,
        };

        next();
    } catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired access token.",
        });
    }
}
