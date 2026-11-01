"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidMimeType = isValidMimeType;
exports.isValidExtension = isValidExtension;
exports.isValidFileSize = isValidFileSize;
exports.validateImageMagicBytes = validateImageMagicBytes;
exports.validateImageFile = validateImageFile;
const node_path_1 = __importDefault(require("node:path"));
const file_constants_1 = require("../constants/file.constants");
function isValidMimeType(mimeType) {
    if (!mimeType)
        return false;
    const normalized = mimeType.toLowerCase().trim();
    return file_constants_1.FILE_CONSTANTS.ALLOWED_IMAGE_MIME_TYPES.includes(normalized);
}
function isValidExtension(filename) {
    if (!filename)
        return false;
    const ext = node_path_1.default.extname(filename).toLowerCase().trim();
    return file_constants_1.FILE_CONSTANTS.ALLOWED_IMAGE_EXTENSIONS.includes(ext);
}
function isValidFileSize(sizeBytes, maxSizeBytes = file_constants_1.FILE_CONSTANTS.MAX_IMAGE_SIZE_BYTES) {
    return typeof sizeBytes === "number" && sizeBytes > 0 && sizeBytes <= maxSizeBytes;
}
function validateImageMagicBytes(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
        return false;
    }
    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return true;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a) {
        return true;
    }
    // WebP: RIFF .... WEBP
    if (buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50) {
        return true;
    }
    return false;
}
function validateImageFile(file) {
    if (!file) {
        return { isValid: false, error: file_constants_1.FILE_ERROR_MESSAGES.FILE_REQUIRED };
    }
    if (!isValidMimeType(file.mimetype)) {
        return { isValid: false, error: file_constants_1.FILE_ERROR_MESSAGES.INVALID_FILE_TYPE };
    }
    if (file.originalname && !isValidExtension(file.originalname)) {
        return { isValid: false, error: file_constants_1.FILE_ERROR_MESSAGES.INVALID_FILE_TYPE };
    }
    if (!isValidFileSize(file.size)) {
        return { isValid: false, error: file_constants_1.FILE_ERROR_MESSAGES.FILE_TOO_LARGE };
    }
    if (file.buffer && file.buffer.length > 0) {
        if (!validateImageMagicBytes(file.buffer)) {
            return { isValid: false, error: file_constants_1.FILE_ERROR_MESSAGES.INVALID_FILE_TYPE };
        }
    }
    return { isValid: true };
}
