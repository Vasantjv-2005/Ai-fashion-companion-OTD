import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";

import {
    createWardrobeItemController,
    getWardrobeItemsController,
    getWardrobeItemByIdController,
    updateWardrobeItemController,
    deleteWardrobeItemController,
} from "./wardrobe.controller";

const router = Router();

// All wardrobe endpoints require a valid access token.
router.use(authMiddleware);

// Create a wardrobe item.
router.post("/", createWardrobeItemController);

// Get the authenticated user's wardrobe, with filtering and pagination.
router.get("/", getWardrobeItemsController);

// Get one wardrobe item by ID.
router.get("/:id", getWardrobeItemByIdController);

// Update a wardrobe item by ID.
router.patch("/:id", updateWardrobeItemController);

// Delete a wardrobe item by ID.
router.delete("/:id", deleteWardrobeItemController);

export default router;
