"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const vibes_controller_1 = require("./vibes.controller");
const router = (0, express_1.Router)();
// Public preset aesthetic vibes
router.get("/presets", vibes_controller_1.getPresetVibesController);
// Authenticated user vibes
router.use(auth_middleware_1.authMiddleware);
router.get("/active", vibes_controller_1.getActiveVibeController);
router.get("/", vibes_controller_1.getUserVibesController);
router.post("/", vibes_controller_1.setUserVibeController);
router.delete("/:id", vibes_controller_1.deleteVibeController);
exports.default = router;
