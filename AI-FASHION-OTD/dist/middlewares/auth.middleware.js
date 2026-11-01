"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getAccessTokenSecret() {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error("JWT_ACCESS_SECRET is missing or invalid.");
    }
    return secret;
}
function isAccessTokenPayload(payload) {
    return (typeof payload !== "string" &&
        typeof payload.sub === "string" &&
        typeof payload.email === "string" &&
        payload.type === "access");
}
function authMiddleware(req, res, next) {
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
        const payload = jsonwebtoken_1.default.verify(token, getAccessTokenSecret(), { algorithms: ["HS256"] });
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
    }
    catch {
        res.status(401).json({
            success: false,
            message: "Invalid or expired access token.",
        });
    }
}
