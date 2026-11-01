"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const social_controller_1 = require("./social.controller");
const router = (0, express_1.Router)();
// Public feed & view (no auth required for read)
router.get("/", social_controller_1.getSocialFeedController);
router.get("/:id", social_controller_1.getShareByIdController);
router.get("/:id/comments", social_controller_1.getPostCommentsController);
// Protected actions
router.post("/", auth_middleware_1.authMiddleware, social_controller_1.shareOutfitController);
router.delete("/:id", auth_middleware_1.authMiddleware, social_controller_1.deleteShareController);
router.post("/:id/like", auth_middleware_1.authMiddleware, social_controller_1.toggleLikePostController);
router.post("/:id/comments", auth_middleware_1.authMiddleware, social_controller_1.addCommentController);
exports.default = router;
