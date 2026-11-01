"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cors_1 = __importDefault(require("./config/cors"));
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const events_routes_1 = __importDefault(require("./modules/events/events.routes"));
const profile_routes_1 = __importDefault(require("./modules/profile/profile.routes"));
const wardrobe_routes_1 = __importDefault(require("./modules/wardrobe/wardrobe.routes"));
const wardrobe_image_routes_1 = __importDefault(require("./modules/wardrobe/wardrobe-image.routes"));
const outfits_routes_1 = __importDefault(require("./modules/outfits/outfits.routes"));
const ai_routes_1 = __importDefault(require("./modules/ai/ai.routes"));
const avatar_routes_1 = __importDefault(require("./modules/avatar/avatar.routes"));
const preferences_routes_1 = __importDefault(require("./modules/preferences/preferences.routes"));
const groups_routes_1 = __importDefault(require("./modules/groups/groups.routes"));
const shopping_routes_1 = __importDefault(require("./modules/shopping/shopping.routes"));
const social_routes_1 = __importDefault(require("./modules/social/social.routes"));
const trends_routes_1 = __importDefault(require("./modules/trends/trends.routes"));
const venues_routes_1 = __importDefault(require("./modules/venues/venues.routes"));
const vibes_routes_1 = __importDefault(require("./modules/vibes/vibes.routes"));
const virtual_try_on_routes_1 = __importDefault(require("./modules/virtual-try-on/virtual-try-on.routes"));
const wardrobe_intelligence_routes_1 = __importDefault(require("./modules/wardrobe-intelligence/wardrobe-intelligence.routes"));
const weather_routes_1 = __importDefault(require("./modules/weather/weather.routes"));
const not_found_middleware_1 = __importDefault(require("./middlewares/not-found.middleware"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
const app = (0, express_1.default)();
app.disable("x-powered-by");
// Security headers
app.use((0, helmet_1.default)());
// Shared CORS configuration
app.use(cors_1.default);
// Request parsing
app.use(express_1.default.json({ limit: "2mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "2mb" }));
app.use((0, cookie_parser_1.default)());
// HTTP request logging
if (process.env.NODE_ENV !== "test") {
    app.use((0, morgan_1.default)("dev"));
}
// Authentication rate limiting
const authLimiter = (0, express_rate_limit_1.default)({
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
app.use("/api/auth", authLimiter, auth_routes_1.default);
app.use("/api/profile", profile_routes_1.default);
app.use("/api/wardrobe", wardrobe_routes_1.default);
app.use("/api/wardrobe", wardrobe_image_routes_1.default);
app.use("/api/outfits", outfits_routes_1.default);
app.use("/api/events", events_routes_1.default);
app.use("/api/ai", ai_routes_1.default);
app.use("/api/avatar", avatar_routes_1.default);
app.use("/api/preferences", preferences_routes_1.default);
app.use("/api/groups", groups_routes_1.default);
app.use("/api/shopping", shopping_routes_1.default);
app.use("/api/social", social_routes_1.default);
app.use("/api/trends", trends_routes_1.default);
app.use("/api/venues", venues_routes_1.default);
app.use("/api/vibes", vibes_routes_1.default);
app.use("/api/virtual-try-on", virtual_try_on_routes_1.default);
app.use("/api/wardrobe-intelligence", wardrobe_intelligence_routes_1.default);
app.use("/api/weather", weather_routes_1.default);
// Handle unknown routes
app.use(not_found_middleware_1.default);
// Global error handler
app.use(error_middleware_1.default);
exports.default = app;
