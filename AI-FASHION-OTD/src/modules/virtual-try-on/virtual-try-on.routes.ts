import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import { uploadSingleImage } from "../../middlewares/upload.middleware";
import {
    createTryOnController,
    getTryOnController,
    listTryOnsController,
    deleteTryOnController,
} from "./virtual-try-on.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", uploadSingleImage, createTryOnController);
router.get("/", listTryOnsController);
router.get("/:id", getTryOnController);
router.delete("/:id", deleteTryOnController);

export default router;

