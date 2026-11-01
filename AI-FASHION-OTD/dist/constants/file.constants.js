"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FILE_ERROR_MESSAGES = exports.FILE_CONSTANTS = void 0;
exports.FILE_CONSTANTS = {
    MAX_IMAGE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
    MAX_IMAGE_SIZE_MB: 5,
    ALLOWED_IMAGE_MIME_TYPES: [
        "image/jpeg",
        "image/png",
        "image/webp",
    ],
    ALLOWED_IMAGE_EXTENSIONS: [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    ],
    GRIDFS_BUCKET_NAME: "wardrobeImages",
    IMAGE_FIELD_NAME: "image",
};
exports.FILE_ERROR_MESSAGES = {
    FILE_REQUIRED: "Please upload an image.",
    INVALID_FILE_TYPE: "Only JPEG, PNG, and WebP images are allowed.",
    FILE_TOO_LARGE: "Image size must not exceed 5 MB.",
    INVALID_FILE_ID: "Invalid image file ID.",
    FILE_NOT_FOUND: "Image file was not found.",
    UPLOAD_FAILED: "Image upload failed. Please try again.",
    DELETE_FAILED: "Image deletion failed. Please try again.",
};
