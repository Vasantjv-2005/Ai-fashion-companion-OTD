import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleImage } from "../../middlewares/upload.middleware";
import {
    getAvatarController,
    createOrUpdateAvatarController,
    uploadAvatarImageController,
    deleteAvatarController,
} from "./avatar.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", getAvatarController);
router.post("/", createOrUpdateAvatarController);
router.put("/", createOrUpdateAvatarController);
router.post("/upload", uploadSingleImage, uploadAvatarImageController);
router.delete("/", deleteAvatarController);

export default router;

