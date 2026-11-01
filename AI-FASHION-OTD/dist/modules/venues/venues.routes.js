"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const venues_controller_1 = require("./venues.controller");
const router = (0, express_1.Router)();
// Public venue listing and details
router.get("/", venues_controller_1.getVenuesController);
router.get("/:id", venues_controller_1.getVenueByIdController);
// Authenticated venue actions
router.post("/", auth_middleware_1.authMiddleware, venues_controller_1.createVenueController);
router.get("/:id/intelligence", auth_middleware_1.authMiddleware, venues_controller_1.getVenueIntelligenceController);
exports.default = router;
