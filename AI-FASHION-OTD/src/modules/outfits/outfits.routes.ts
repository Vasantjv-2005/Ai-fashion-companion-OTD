import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";

import {
    createOutfitController,
    getOutfitsController,
    getOutfitByIdController,
    updateOutfitController,
    deleteOutfitController,
    generateOutfitsController,
    logOutfitWearController,
    getOutfitHistoryController,
    deleteOutfitHistoryController,
} from "./outfits.controller";

const router = Router();

// Protect all outfit endpoints.
router.use(authMiddleware);

// Generate outfits from wardrobe items
router.post("/generate", generateOutfitsController);

// Outfit history routes
router.post("/history", logOutfitWearController);
router.get("/history", getOutfitHistoryController);
router.delete("/history/:id", deleteOutfitHistoryController);

// Standard outfit CRUD
router.post("/", createOutfitController);
router.get("/", getOutfitsController);
router.get("/:id", getOutfitByIdController);
router.patch("/:id", updateOutfitController);
router.delete("/:id", deleteOutfitController);

export default router;
