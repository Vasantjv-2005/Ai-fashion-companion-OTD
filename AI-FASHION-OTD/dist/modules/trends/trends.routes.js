"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const trends_controller_1 = require("./trends.controller");
const router = (0, express_1.Router)();
// Public routes
router.get("/", trends_controller_1.getTrendsController);
// Authenticated routes
router.get("/personalized", auth_middleware_1.authMiddleware, trends_controller_1.getPersonalizedTrendsController);
router.post("/interact", auth_middleware_1.authMiddleware, trends_controller_1.interactTrendController);
// Public route for specific trend
router.get("/:id", trends_controller_1.getTrendByIdController);
exports.default = router;
