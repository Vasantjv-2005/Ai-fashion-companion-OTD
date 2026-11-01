"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const outfits_controller_1 = require("./outfits.controller");
const router = (0, express_1.Router)();
// Protect all outfit endpoints.
router.use(auth_middleware_1.authMiddleware);
// Generate outfits from wardrobe items
router.post("/generate", outfits_controller_1.generateOutfitsController);
// Outfit history routes
router.post("/history", outfits_controller_1.logOutfitWearController);
router.get("/history", outfits_controller_1.getOutfitHistoryController);
router.delete("/history/:id", outfits_controller_1.deleteOutfitHistoryController);
// Standard outfit CRUD
router.post("/", outfits_controller_1.createOutfitController);
router.get("/", outfits_controller_1.getOutfitsController);
router.get("/:id", outfits_controller_1.getOutfitByIdController);
router.patch("/:id", outfits_controller_1.updateOutfitController);
router.delete("/:id", outfits_controller_1.deleteOutfitController);
exports.default = router;
