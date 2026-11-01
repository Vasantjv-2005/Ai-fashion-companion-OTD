import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    createVenueController,
    getVenuesController,
    getVenueByIdController,
    getVenueIntelligenceController,
} from "./venues.controller";

const router = Router();

// Public venue listing and details
router.get("/", getVenuesController);
router.get("/:id", getVenueByIdController);

// Authenticated venue actions
router.post("/", authMiddleware, createVenueController);
router.get("/:id/intelligence", authMiddleware, getVenueIntelligenceController);

export default router;

