"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const wardrobe_image_controller_1 = require("./wardrobe-image.controller");
const router = (0, express_1.Router)();
// All wardrobe image endpoints require authentication.
router.use(auth_middleware_1.authMiddleware);
// Upload or replace an item's image.
// The uploaded file must use the multipart field name "image".
router.post("/:id/image", upload_middleware_1.uploadSingleImage, wardrobe_image_controller_1.uploadWardrobeItemImageController);
// Delete an item's image.
router.delete("/:id/image", wardrobe_image_controller_1.deleteWardrobeItemImageController);
exports.default = router;
