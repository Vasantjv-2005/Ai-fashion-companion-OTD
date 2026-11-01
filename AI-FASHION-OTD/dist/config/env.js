"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env from process.cwd() or project root directory
dotenv_1.default.config();
dotenv_1.default.config({ path: node_path_1.default.resolve(__dirname, "../../.env") });
// Legacy environment variable fallbacks
if (!process.env.JWT_ACCESS_SECRET && process.env.JWT_SECRET) {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET;
}
if (!process.env.JWT_REFRESH_SECRET && process.env.JWT_SECRET) {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
}
if (!process.env.FRONTEND_URL && process.env.CLIENT_URL) {
    process.env.FRONTEND_URL = process.env.CLIENT_URL;
}
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: zod_1.z.coerce.number().int().min(1).max(65535).default(5000),
    MONGODB_URI: zod_1.z
        .string()
        .min(1, "MONGODB_URI is required."),
    JWT_ACCESS_SECRET: zod_1.z
        .string()
        .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters."),
    JWT_REFRESH_SECRET: zod_1.z
        .string()
        .min(32, "JWT_REFRESH_SECRET must contain at least 32 characters.")
        .optional(),
    AI_SERVICE_URL: zod_1.z
        .string()
        .url("AI_SERVICE_URL must be a valid URL.")
        .optional(),
    AI_SERVICE_TIMEOUT_MS: zod_1.z.coerce
        .number()
        .int()
        .positive()
        .default(15000),
    FRONTEND_URL: zod_1.z
        .string()
        .url("FRONTEND_URL must be a valid URL.")
        .default("http://localhost:3000"),
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("❌ Invalid environment configuration:");
    for (const issue of parsedEnv.error.issues) {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Environment configuration validation failed.");
}
exports.env = parsedEnv.data;
