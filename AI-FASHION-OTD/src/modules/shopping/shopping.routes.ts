import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    createRecommendationController,
    getRecommendationsController,
    updateRecommendationStatusController,
    generateGapShoppingListController,
    deleteRecommendationController,
} from "./shopping.controller";

const router = Router();

router.use(authMiddleware);

// Generate items to fill wardrobe gaps
router.post("/gaps", generateGapShoppingListController);

// Standard shopping recommendation routes
router.post("/", createRecommendationController);
router.get("/", getRecommendationsController);
router.patch("/:id/status", updateRecommendationStatusController);
router.delete("/:id", deleteRecommendationController);

export default router;

