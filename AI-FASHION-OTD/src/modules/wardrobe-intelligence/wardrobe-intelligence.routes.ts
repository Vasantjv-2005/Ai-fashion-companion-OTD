import { Router } from "express";
import {
  uploadSingleFashionClipImage,
} from "../../middlewares/upload.middleware";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
  recognizeClothingImageController,
  getAnalyticsController,
  analyzeGapsController,
  getGapsController,
  updateGapStatusController,
  logUsageController,
  getItemStatsController,
} from "./wardrobe-intelligence.controller";

const router = Router();

router.use(authMiddleware);

// Clothing recognition; the uploaded image is held in memory and not saved.
router.post(
  "/predict",
  uploadSingleFashionClipImage,
  recognizeClothingImageController,
);

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
