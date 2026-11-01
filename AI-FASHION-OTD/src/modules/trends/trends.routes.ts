import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    getTrendsController,
    getTrendByIdController,
    interactTrendController,
    getPersonalizedTrendsController,
} from "./trends.controller";

const router = Router();

// Public routes
router.get("/", getTrendsController);

// Authenticated routes
router.get("/personalized", authMiddleware, getPersonalizedTrendsController);
router.post("/interact", authMiddleware, interactTrendController);

// Public route for specific trend
router.get("/:id", getTrendByIdController);

export default router;

