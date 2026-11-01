"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const wardrobe_intelligence_controller_1 = require("./wardrobe-intelligence.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Analytics
router.get("/analytics", wardrobe_intelligence_controller_1.getAnalyticsController);
// Gaps
router.post("/gaps/analyze", wardrobe_intelligence_controller_1.analyzeGapsController);
router.get("/gaps", wardrobe_intelligence_controller_1.getGapsController);
router.patch("/gaps/:id/status", wardrobe_intelligence_controller_1.updateGapStatusController);
// Usage logging & statistics
router.post("/usage", wardrobe_intelligence_controller_1.logUsageController);
router.get("/usage/:itemId", wardrobe_intelligence_controller_1.getItemStatsController);
exports.default = router;
