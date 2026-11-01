import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    setUserVibeController,
    getActiveVibeController,
    getUserVibesController,
    getPresetVibesController,
    deleteVibeController,
} from "./vibes.controller";

const router = Router();

// Public preset aesthetic vibes
router.get("/presets", getPresetVibesController);

// Authenticated user vibes
router.use(authMiddleware);
router.get("/active", getActiveVibeController);
router.get("/", getUserVibesController);
router.post("/", setUserVibeController);
router.delete("/:id", deleteVibeController);

export default router;

