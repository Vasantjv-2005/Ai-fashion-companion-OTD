
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import corsMiddleware from "./config/cors";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

app.disable("x-powered-by");

// Security headers
app.use(helmet());

// Shared CORS configuration
app.use(corsMiddleware);

// Request parsing
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// HTTP request logging
app.use(morgan("dev"));

// Authentication rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "AI Fashion Companion API is running.",
    });
});

// Authentication routes
app.use("/api/auth", authLimiter, authRoutes);

// Handle unknown routes
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found.",
    });
});

// Global error handler
app.use(
    (
        error: unknown,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ) => {
        console.error("Unhandled request error:", error);

        res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    },
);

export default app;
