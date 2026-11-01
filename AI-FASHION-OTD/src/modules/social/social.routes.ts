import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    shareOutfitController,
    getSocialFeedController,
    getShareByIdController,
    toggleLikePostController,
    addCommentController,
    getPostCommentsController,
    deleteShareController,
} from "./social.controller";

const router = Router();

// Public feed & view (no auth required for read)
router.get("/", getSocialFeedController);
router.get("/:id", getShareByIdController);
router.get("/:id/comments", getPostCommentsController);

// Protected actions
router.post("/", authMiddleware, shareOutfitController);
router.delete("/:id", authMiddleware, deleteShareController);
router.post("/:id/like", authMiddleware, toggleLikePostController);
router.post("/:id/comments", authMiddleware, addCommentController);

export default router;

