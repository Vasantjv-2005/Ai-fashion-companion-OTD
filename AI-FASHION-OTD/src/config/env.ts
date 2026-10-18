
import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce.number().int().min(1).max(65535).default(5000),

    MONGODB_URI: z
        .string()
        .min(1, "MONGODB_URI is required."),

    JWT_ACCESS_SECRET: z
        .string()
        .min(32, "JWT_ACCESS_SECRET must contain at least 32 characters."),

    AI_SERVICE_URL: z
        .string()
        .url("AI_SERVICE_URL must be a valid URL.")
        .optional(),

    AI_SERVICE_TIMEOUT_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(15000),

    FRONTEND_URL: z
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

export const env = parsedEnv.data;

export type Environment = typeof env;
