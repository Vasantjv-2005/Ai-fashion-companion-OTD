import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    getPreferencesController,
    updatePreferencesController,
    resetPreferencesController,
} from "./preferences.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getPreferencesController);
router.patch("/", updatePreferencesController);
router.put("/", updatePreferencesController);
router.post("/reset", resetPreferencesController);

export default router;

