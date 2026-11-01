import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    getAnalyticsController,
    analyzeGapsController,
    getGapsController,
    updateGapStatusController,
    logUsageController,
    getItemStatsController,
} from "./wardrobe-intelligence.controller";

const router = Router();

router.use(authMiddleware);

// Analytics
router.get("/analytics", getAnalyticsController);

// Gaps
router.post("/gaps/analyze", analyzeGapsController);
router.get("/gaps", getGapsController);
router.patch("/gaps/:id/status", updateGapStatusController);

// Usage logging & statistics
router.post("/usage", logUsageController);
router.get("/usage/:itemId", getItemStatsController);

export default router;

