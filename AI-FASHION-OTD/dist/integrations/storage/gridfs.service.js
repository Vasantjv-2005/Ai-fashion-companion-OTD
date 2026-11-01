"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridFSServiceError = void 0;
exports.saveImage = saveImage;
exports.getImageStream = getImageStream;
exports.removeImage = removeImage;
const gridfs_1 = require("../../config/gridfs");
class GridFSServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "GridFSServiceError";
    }
}
exports.GridFSServiceError = GridFSServiceError;
const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
function validateImage(input) {
    if (!input.filename.trim()) {
        throw new GridFSServiceError("Image filename is required.", 400);
    }
    if (!ALLOWED_IMAGE_TYPES.has(input.contentType.toLowerCase())) {
        throw new GridFSServiceError("Only JPEG, PNG, and WebP images are allowed.", 415);
    }
    if (!Buffer.isBuffer(input.buffer) || input.buffer.length === 0) {
        throw new GridFSServiceError("The uploaded image is empty.", 400);
    }
    if (input.buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new GridFSServiceError("Image size must not exceed 5 MB.", 413);
    }
}
/**
 * Uploads an image to MongoDB GridFS.
 */
async function saveImage(input) {
    validateImage(input);
    return new Promise((resolve, reject) => {
        let settled = false;
        const stream = (0, gridfs_1.uploadImage)(input.filename.trim(), input.contentType.toLowerCase());
        stream.once("error", (error) => {
            if (settled)
                return;
            settled = true;
            reject(new GridFSServiceError(`Image upload failed: ${error.message}`, 500));
        });
        stream.once("finish", () => {
            if (settled)
                return;
            settled = true;
            resolve({
                fileId: stream.id.toString(),
                filename: input.filename.trim(),
                contentType: input.contentType.toLowerCase(),
                size: input.buffer.length,
            });
        });
        stream.end(input.buffer);
    });
}
/**
 * Opens a readable stream for an existing image.
 * The caller should pipe this stream to the HTTP response.
 */
function getImageStream(fileId) {
    try {
        return (0, gridfs_1.downloadImage)(fileId);
    }
    catch (error) {
        if (error instanceof GridFSServiceError) {
            throw error;
        }
        throw new GridFSServiceError("Unable to open the requested image.", 400);
    }
}
/**
 * Deletes an image from GridFS.
 */
async function removeImage(fileId) {
    if (!fileId.trim()) {
        throw new GridFSServiceError("Image file ID is required.", 400);
    }
    try {
        await (0, gridfs_1.deleteImage)(fileId);
    }
    catch (error) {
        if (error instanceof Error && error.message === "FileNotFound") {
            throw new GridFSServiceError("Image file was not found.", 404);
        }
        throw new GridFSServiceError("Unable to delete the requested image.", 500);
    }
}
