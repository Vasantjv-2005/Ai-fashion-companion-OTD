"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const shopping_controller_1 = require("./shopping.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Generate items to fill wardrobe gaps
router.post("/gaps", shopping_controller_1.generateGapShoppingListController);
// Standard shopping recommendation routes
router.post("/", shopping_controller_1.createRecommendationController);
router.get("/", shopping_controller_1.getRecommendationsController);
router.patch("/:id/status", shopping_controller_1.updateRecommendationStatusController);
router.delete("/:id", shopping_controller_1.deleteRecommendationController);
exports.default = router;
