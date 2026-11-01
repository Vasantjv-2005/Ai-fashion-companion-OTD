import jwt from "jsonwebtoken";
import { AUTH_CONSTANTS } from "../constants/auth.constants";
import type { JwtAccessTokenPayload, JwtRefreshTokenPayload } from "../modules/auth/auth.types";

export function getAccessTokenSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters.");
    }
    return secret;
}

export function getRefreshTokenSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_REFRESH_SECRET must be configured with at least 32 characters.");
    }
    return secret;
}

export function generateAccessToken(payload: { id: string; email: string }): string {
    const tokenPayload: JwtAccessTokenPayload = {
        sub: payload.id,
        email: payload.email,
        type: "access",
    };

    return jwt.sign(tokenPayload, getAccessTokenSecret(), {
        algorithm: "HS256",
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    });
}

export function generateRefreshToken(payload: { id: string; jti: string }): string {
    const tokenPayload: JwtRefreshTokenPayload = {
        sub: payload.id,
        jti: payload.jti,
        type: "refresh",
    };

    return jwt.sign(tokenPayload, getRefreshTokenSecret(), {
        algorithm: "HS256",
        expiresIn: `${AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS}d` as jwt.SignOptions["expiresIn"],
    });
}

export function verifyAccessToken(token: string): JwtAccessTokenPayload {
    const decoded = jwt.verify(token, getAccessTokenSecret(), {
        algorithms: ["HS256"],
    });

    if (
        typeof decoded !== "object" ||
        decoded === null ||
        !("sub" in decoded) ||
        !("email" in decoded) ||
        decoded.type !== "access"
    ) {
        throw new Error("Invalid access token payload.");
    }

    return decoded as unknown as JwtAccessTokenPayload;
}

export function verifyRefreshToken(token: string): JwtRefreshTokenPayload {
    const decoded = jwt.verify(token, getRefreshTokenSecret(), {
        algorithms: ["HS256"],
    });

    if (
        typeof decoded !== "object" ||
        decoded === null ||
        !("sub" in decoded) ||
        decoded.type !== "refresh"
    ) {
        throw new Error("Invalid refresh token payload.");
    }

    return decoded as unknown as JwtRefreshTokenPayload;
}

export function decodeToken(token: string): jwt.JwtPayload | null {
    const decoded = jwt.decode(token);
    return typeof decoded === "object" && decoded !== null ? (decoded as jwt.JwtPayload) : null;
}

