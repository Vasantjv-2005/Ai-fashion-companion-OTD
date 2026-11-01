"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const wardrobe_controller_1 = require("./wardrobe.controller");
const router = (0, express_1.Router)();
// All wardrobe endpoints require a valid access token.
router.use(auth_middleware_1.authMiddleware);
// Create a wardrobe item.
router.post("/", wardrobe_controller_1.createWardrobeItemController);
// Get the authenticated user's wardrobe, with filtering and pagination.
router.get("/", wardrobe_controller_1.getWardrobeItemsController);
// Get one wardrobe item by ID.
router.get("/:id", wardrobe_controller_1.getWardrobeItemByIdController);
// Update a wardrobe item by ID.
router.patch("/:id", wardrobe_controller_1.updateWardrobeItemController);
// Delete a wardrobe item by ID.
router.delete("/:id", wardrobe_controller_1.deleteWardrobeItemController);
exports.default = router;
