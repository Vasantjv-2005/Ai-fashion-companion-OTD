"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGridFSBucket = getGridFSBucket;
exports.uploadImage = uploadImage;
exports.downloadImage = downloadImage;
exports.deleteImage = deleteImage;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb");
let bucket = null;
function getGridFSBucket() {
    if (mongoose_1.default.connection.readyState !== 1 || !mongoose_1.default.connection.db) {
        throw new Error("MongoDB must be connected before accessing GridFS.");
    }
    if (!bucket) {
        bucket = new mongodb_1.GridFSBucket(mongoose_1.default.connection.db, {
            bucketName: "wardrobeImages",
        });
    }
    return bucket;
}
function uploadImage(filename, contentType) {
    if (!filename.trim()) {
        throw new Error("Image filename is required.");
    }
    if (!contentType.startsWith("image/")) {
        throw new Error("Only image files are allowed.");
    }
    return getGridFSBucket().openUploadStream(filename, {
        metadata: {
            contentType,
            uploadedAt: new Date(),
        },
    });
}
function downloadImage(fileId) {
    if (!mongodb_1.ObjectId.isValid(fileId)) {
        throw new Error("Invalid GridFS file ID.");
    }
    return getGridFSBucket().openDownloadStream(new mongodb_1.ObjectId(fileId));
}
async function deleteImage(fileId) {
    if (!mongodb_1.ObjectId.isValid(fileId)) {
        throw new Error("Invalid GridFS file ID.");
    }
    await getGridFSBucket().delete(new mongodb_1.ObjectId(fileId));
}
