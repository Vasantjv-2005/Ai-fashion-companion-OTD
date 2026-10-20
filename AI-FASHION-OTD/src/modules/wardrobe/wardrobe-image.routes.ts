
import { Router } from "express";

import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleImage } from "../../middlewares/upload.middleware";

import {
    uploadWardrobeItemImageController,
    deleteWardrobeItemImageController,
} from "./wardrobe-image.controller";

const router = Router();

// All wardrobe image endpoints require authentication.
router.use(authMiddleware);

// Upload or replace an item's image.
// The uploaded file must use the multipart field name "image".
router.post(
    "/:id/image",
    uploadSingleImage,
    uploadWardrobeItemImageController,
);

// Delete an item's image.
router.delete(
    "/:id/image",
    deleteWardrobeItemImageController,
);

export default router;