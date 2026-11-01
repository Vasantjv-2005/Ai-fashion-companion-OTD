import { Router } from "express";
import {
    getMyProfile,
    createMyProfile,
    updateMyProfile,
} from "./profile.controller";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

// Protect all profile routes
router.use(authMiddleware);

// GET /api/profile — Get the user's profile
router.get("/", getMyProfile);

// POST /api/profile — Create a profile
router.post("/", createMyProfile);

// PATCH /api/profile — Update the user's profile
router.patch("/", updateMyProfile);

export default router;