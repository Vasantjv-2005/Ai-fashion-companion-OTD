
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";

import { AUTH_CONSTANTS } from "../../constants/auth.constants";
import { User } from "../../models/User";
import RefreshToken from "../../models/RefreshToken";

import type {
    AuthResult,
    AuthenticatedUser,
    JwtAccessTokenPayload,
    LoginInput,
    RegisterInput,
} from "./auth.types";

export class AuthServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
    ) {
        super(message);
        this.name = "AuthServiceError";
    }
}

function getAccessTokenSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret || secret.length < 32) {
        throw new AuthServiceError(
            "JWT_ACCESS_SECRET must be configured with at least 32 characters.",
            500,
        );
    }

    return secret;
}

function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function toAuthenticatedUser(user: {
    id: string;
    name: string;
    email: string;
}): AuthenticatedUser {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}

function createAccessToken(user: {
    id: string;
    email: string;
}): string {
    const payload: JwtAccessTokenPayload = {
        sub: user.id,
        email: user.email,
        type: "access",
    };

    return jwt.sign(payload, getAccessTokenSecret(), {
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"],
    });
}

async function createAuthResult(user: {
    id: string;
    name: string;
    email: string;
}): Promise<AuthResult> {
    const refreshToken = randomBytes(48).toString("hex");

    const expiresAt = new Date(
        Date.now() +
        AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    await RefreshToken.create({
        userId: user.id,
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt,
        revokedAt: null,
    });

    return {
        user: toAuthenticatedUser(user),
        tokens: {
            accessToken: createAccessToken(user),
            refreshToken,
        },
    };
}

export async function registerUser(
    input: RegisterInput,
): Promise<AuthResult> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name || !email || !input.password) {
        throw new AuthServiceError(
            "Name, email, and password are required.",
            400,
        );
    }

    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
        throw new AuthServiceError(
            "An account with this email already exists.",
            409,
        );
    }

    const passwordHash = await argon2.hash(input.password);

    try {
        const user = await User.create({
            name,
            email,
            passwordHash,
        });

        return await createAuthResult({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    } catch (error: unknown) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000
        ) {
            throw new AuthServiceError(
                "An account with this email already exists.",
                409,
            );
        }

        throw error;
    }
}

export async function loginUser(
    input: LoginInput,
): Promise<AuthResult> {
    const email = input.email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user || !user.passwordHash) {
        throw new AuthServiceError(
            "Invalid email or password.",
            401,
        );
    }

    const passwordMatches = await argon2.verify(
        user.passwordHash,
        input.password,
    );

    if (!passwordMatches) {
        throw new AuthServiceError(
            "Invalid email or password.",
            401,
        );
    }

    if (!user.isActive) {
        throw new AuthServiceError(
            "This account is disabled.",
            403,
        );
    }

    return createAuthResult({
        id: user.id,
        name: user.name,
        email: user.email,
    });
}

export async function refreshSession(
    rawRefreshToken: string,
): Promise<AuthResult> {
    if (!rawRefreshToken?.trim()) {
        throw new AuthServiceError(
            "Refresh token is required.",
            400,
        );
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    const storedToken = await RefreshToken.findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    });

    if (!storedToken) {
        throw new AuthServiceError(
            "Invalid or expired refresh token.",
            401,
        );
    }

    const user = await User.findById(storedToken.userId);

    if (!user || !user.isActive) {
        throw new AuthServiceError(
            "Invalid or expired refresh token.",
            401,
        );
    }

    const revokedToken = await RefreshToken.findOneAndUpdate(
        {
            _id: storedToken._id,
            revokedAt: null,
            expiresAt: { $gt: new Date() },
        },
        {
            $set: { revokedAt: new Date() },
        },
        { new: true },
    );

    if (!revokedToken) {
        throw new AuthServiceError(
            "Invalid or expired refresh token.",
            401,
        );
    }

    return createAuthResult({
        id: user.id,
        name: user.name,
        email: user.email,
    });
}

export async function logoutUser(
    rawRefreshToken: string,
): Promise<void> {
    if (!rawRefreshToken?.trim()) {
        throw new AuthServiceError(
            "Refresh token is required.",
            400,
        );
    }

    await RefreshToken.updateOne(
        {
            tokenHash: hashRefreshToken(rawRefreshToken),
            revokedAt: null,
        },
        {
            $set: { revokedAt: new Date() },
        },
    );
}
