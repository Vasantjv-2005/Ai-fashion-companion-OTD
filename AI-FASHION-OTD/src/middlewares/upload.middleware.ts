
import multer from "multer";
import type { Request } from "express";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (
    _req: Request,
    file: Express.Multer.File,
    callback,
): void => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype.toLowerCase())) {
        callback(
            new Error("Only JPEG, PNG, and WebP images are allowed."),
        );
        return;
    }

    callback(null, true);
};

export const uploadSingleImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: 1,
    },
}).single("image");

export const uploadMultipleImages = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: 5,
    },
}).array("images", 5);

export default uploadSingleImage;
