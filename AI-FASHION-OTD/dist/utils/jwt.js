"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccessTokenSecret = getAccessTokenSecret;
exports.getRefreshTokenSecret = getRefreshTokenSecret;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.decodeToken = decodeToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_constants_1 = require("../constants/auth.constants");
function getAccessTokenSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET must be configured with at least 32 characters.");
    }
    return secret;
}
function getRefreshTokenSecret() {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_REFRESH_SECRET must be configured with at least 32 characters.");
    }
    return secret;
}
function generateAccessToken(payload) {
    const tokenPayload = {
        sub: payload.id,
        email: payload.email,
        type: "access",
    };
    return jsonwebtoken_1.default.sign(tokenPayload, getAccessTokenSecret(), {
        algorithm: "HS256",
        expiresIn: auth_constants_1.AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY,
    });
}
function generateRefreshToken(payload) {
    const tokenPayload = {
        sub: payload.id,
        jti: payload.jti,
        type: "refresh",
    };
    return jsonwebtoken_1.default.sign(tokenPayload, getRefreshTokenSecret(), {
        algorithm: "HS256",
        expiresIn: `${auth_constants_1.AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS}d`,
    });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, getAccessTokenSecret(), {
        algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" ||
        decoded === null ||
        !("sub" in decoded) ||
        !("email" in decoded) ||
        decoded.type !== "access") {
        throw new Error("Invalid access token payload.");
    }
    return decoded;
}
function verifyRefreshToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, getRefreshTokenSecret(), {
        algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" ||
        decoded === null ||
        !("sub" in decoded) ||
        decoded.type !== "refresh") {
        throw new Error("Invalid refresh token payload.");
    }
    return decoded;
}
function decodeToken(token) {
    const decoded = jsonwebtoken_1.default.decode(token);
    return typeof decoded === "object" && decoded !== null ? decoded : null;
}
