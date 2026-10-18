
import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import type { GridFSBucketReadStream, GridFSBucketWriteStream } from "mongodb";

let bucket: GridFSBucket | null = null;

export function getGridFSBucket(): GridFSBucket {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        throw new Error(
            "MongoDB must be connected before accessing GridFS.",
        );
    }

    if (!bucket) {
        bucket = new GridFSBucket(mongoose.connection.db, {
            bucketName: "wardrobeImages",
        });
    }

    return bucket;
}

export function uploadImage(
    filename: string,
    contentType: string,
): GridFSBucketWriteStream {
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

export function downloadImage(
    fileId: string,
): GridFSBucketReadStream {
    if (!ObjectId.isValid(fileId)) {
        throw new Error("Invalid GridFS file ID.");
    }

    return getGridFSBucket().openDownloadStream(
        new ObjectId(fileId),
    );
}

export async function deleteImage(
    fileId: string,
): Promise<void> {
    if (!ObjectId.isValid(fileId)) {
        throw new Error("Invalid GridFS file ID.");
    }

    await getGridFSBucket().delete(new ObjectId(fileId));
}
