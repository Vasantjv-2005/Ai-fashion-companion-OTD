import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import corsMiddleware from "./config/cors";
import authRoutes from "./modules/auth/auth.routes";
import eventRoutes from "./modules/events/events.routes";
import profileRoutes from "./modules/profile/profile.routes";
import wardrobeRoutes from "./modules/wardrobe/wardrobe.routes";
import wardrobeImageRoutes from "./modules/wardrobe/wardrobe-image.routes";
import outfitRoutes from "./modules/outfits/outfits.routes";
import aiRoutes from "./modules/ai/ai.routes";
import avatarRoutes from "./modules/avatar/avatar.routes";
import preferencesRoutes from "./modules/preferences/preferences.routes";
import groupsRoutes from "./modules/groups/groups.routes";
import shoppingRoutes from "./modules/shopping/shopping.routes";
import socialRoutes from "./modules/social/social.routes";
import trendsRoutes from "./modules/trends/trends.routes";
import venuesRoutes from "./modules/venues/venues.routes";
import vibesRoutes from "./modules/vibes/vibes.routes";
import virtualTryOnRoutes from "./modules/virtual-try-on/virtual-try-on.routes";
import wardrobeIntelligenceRoutes from "./modules/wardrobe-intelligence/wardrobe-intelligence.routes";
import weatherRoutes from "./modules/weather/weather.routes";

import notFoundMiddleware from "./middlewares/not-found.middleware";
import errorMiddleware from "./middlewares/error.middleware";

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
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

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

// Module routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/wardrobe", wardrobeRoutes);
app.use("/api/wardrobe", wardrobeImageRoutes);
app.use("/api/outfits", outfitRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/avatar", avatarRoutes);
app.use("/api/preferences", preferencesRoutes);
app.use("/api/groups", groupsRoutes);
app.use("/api/shopping", shoppingRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/venues", venuesRoutes);
app.use("/api/vibes", vibesRoutes);
app.use("/api/virtual-try-on", virtualTryOnRoutes);
app.use("/api/wardrobe-intelligence", wardrobeIntelligenceRoutes);
app.use("/api/weather", weatherRoutes);

// Handle unknown routes
app.use(notFoundMiddleware);

// Global error handler
app.use(errorMiddleware);

export default app;
