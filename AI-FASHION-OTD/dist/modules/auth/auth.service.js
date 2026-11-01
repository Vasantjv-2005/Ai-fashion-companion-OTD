"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthServiceError = void 0;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.refreshSession = refreshSession;
exports.logoutUser = logoutUser;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_crypto_1 = require("node:crypto");
const auth_constants_1 = require("../../constants/auth.constants");
const User_1 = require("../../models/User");
const RefreshToken_1 = __importDefault(require("../../models/RefreshToken"));
class AuthServiceError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AuthServiceError";
    }
}
exports.AuthServiceError = AuthServiceError;
function getAccessTokenSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new AuthServiceError("JWT_ACCESS_SECRET must be configured with at least 32 characters.", 500);
    }
    return secret;
}
function hashRefreshToken(token) {
    return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
function toAuthenticatedUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}
function createAccessToken(user) {
    const payload = {
        sub: user.id,
        email: user.email,
        type: "access",
    };
    return jsonwebtoken_1.default.sign(payload, getAccessTokenSecret(), {
        expiresIn: auth_constants_1.AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });
}
async function createAuthResult(user) {
    const refreshToken = (0, node_crypto_1.randomBytes)(48).toString("hex");
    const expiresAt = new Date(Date.now() +
        auth_constants_1.AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    await RefreshToken_1.default.create({
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
async function registerUser(input) {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email || !input.password) {
        throw new AuthServiceError("Name, email, and password are required.", 400);
    }
    const existingUser = await User_1.User.findOne({ email }).lean();
    if (existingUser) {
        throw new AuthServiceError("An account with this email already exists.", 409);
    }
    const passwordHash = await argon2_1.default.hash(input.password);
    try {
        const user = await User_1.User.create({
            name,
            email,
            passwordHash,
        });
        return await createAuthResult({
            id: user.id,
            name: user.name,
            email: user.email,
        });
    }
    catch (error) {
        if (typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === 11000) {
            throw new AuthServiceError("An account with this email already exists.", 409);
        }
        throw error;
    }
}
async function loginUser(input) {
    const email = input.email.trim().toLowerCase();
    const user = await User_1.User.findOne({ email }).select("+passwordHash");
    if (!user || !user.passwordHash) {
        throw new AuthServiceError("Invalid email or password.", 401);
    }
    const passwordMatches = await argon2_1.default.verify(user.passwordHash, input.password);
    if (!passwordMatches) {
        throw new AuthServiceError("Invalid email or password.", 401);
    }
    if (!user.isActive) {
        throw new AuthServiceError("This account is disabled.", 403);
    }
    return createAuthResult({
        id: user.id,
        name: user.name,
        email: user.email,
    });
}
async function refreshSession(rawRefreshToken) {
    if (!rawRefreshToken?.trim()) {
        throw new AuthServiceError("Refresh token is required.", 400);
    }
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const storedToken = await RefreshToken_1.default.findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    });
    if (!storedToken) {
        throw new AuthServiceError("Invalid or expired refresh token.", 401);
    }
    const user = await User_1.User.findById(storedToken.userId);
    if (!user || !user.isActive) {
        throw new AuthServiceError("Invalid or expired refresh token.", 401);
    }
    const revokedToken = await RefreshToken_1.default.findOneAndUpdate({
        _id: storedToken._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }, {
        $set: { revokedAt: new Date() },
    }, { new: true });
    if (!revokedToken) {
        throw new AuthServiceError("Invalid or expired refresh token.", 401);
    }
    return createAuthResult({
        id: user.id,
        name: user.name,
        email: user.email,
    });
}
async function logoutUser(rawRefreshToken) {
    if (!rawRefreshToken?.trim()) {
        throw new AuthServiceError("Refresh token is required.", 400);
    }
    await RefreshToken_1.default.updateOne({
        tokenHash: hashRefreshToken(rawRefreshToken),
        revokedAt: null,
    }, {
        $set: { revokedAt: new Date() },
    });
}
