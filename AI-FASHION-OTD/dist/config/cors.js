"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
function getAllowedOrigins() {
    const configuredOrigins = process.env.FRONTEND_URL
        ?.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    return configuredOrigins?.length
        ? configuredOrigins
        : ["http://localhost:3000"];
}
const corsOptions = {
    origin(origin, callback) {
        // Allow requests without an Origin header, such as server-to-server calls.
        if (!origin || getAllowedOrigins().includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
};
exports.default = (0, cors_1.default)(corsOptions);
