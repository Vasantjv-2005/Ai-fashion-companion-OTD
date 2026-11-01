"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("./profile.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all profile routes
router.use(auth_middleware_1.authMiddleware);
// GET /api/profile — Get the user's profile
router.get("/", profile_controller_1.getMyProfile);
// POST /api/profile — Create a profile
router.post("/", profile_controller_1.createMyProfile);
// PATCH /api/profile — Update the user's profile
router.patch("/", profile_controller_1.updateMyProfile);
exports.default = router;
