"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadSingleImage = void 0;
const multer_1 = __importDefault(require("multer"));
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype.toLowerCase())) {
        callback(new Error("Only JPEG, PNG, and WebP images are allowed."));
        return;
    }
    callback(null, true);
};
exports.uploadSingleImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: 1,
    },
}).single("image");
exports.uploadMultipleImages = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: 5,
    },
}).array("images", 5);
exports.default = exports.uploadSingleImage;
