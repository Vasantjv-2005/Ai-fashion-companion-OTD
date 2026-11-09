import multer from "multer";
import type { Request, RequestHandler } from "express";
import { extname } from "node:path";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_FASHIONCLIP_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

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

const fashionClipFileFilter: multer.Options["fileFilter"] = (
  _req: Request,
  file: Express.Multer.File,
  callback,
): void => {
  const mimeType = file.mimetype.toLowerCase();
  const extension = extname(file.originalname).toLowerCase();

  const isJpeg =
    mimeType === "image/jpeg" &&
    (extension === ".jpg" || extension === ".jpeg");
  const isPng = mimeType === "image/png" && extension === ".png";

  if (!isJpeg && !isPng) {
    callback(
      new Error("Fashion recognition accepts JPEG and PNG images only."),
    );
    return;
  }

  callback(null, true);
};

const fashionClipUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fashionClipFileFilter,
  limits: {
    fileSize: MAX_FASHIONCLIP_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

export const uploadSingleFashionClipImage: RequestHandler = (
  req,
  res,
  next,
): void => {
  fashionClipUpload.single("file")(req, res, (error?: unknown): void => {
    if (error instanceof multer.MulterError) {
      const statusCode =
        error.code === "LIMIT_FILE_SIZE" ? 413 : 400;

      res.status(statusCode).json({
        success: false,
        message:
          error.code === "LIMIT_FILE_SIZE"
            ? "Image exceeds the 10 MiB limit."
            : "Invalid image upload.",
      });
      return;
    }

    if (error) {
      res.status(400).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Invalid image upload.",
      });
      return;
    }

    if (!req.file || req.file.size === 0) {
      res.status(400).json({
        success: false,
        message: "A non-empty image file is required.",
      });
      return;
    }

    next();
  });
};

export default uploadSingleImage;
