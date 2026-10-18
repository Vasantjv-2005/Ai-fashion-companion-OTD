
import {
    deleteImage,
    downloadImage,
    uploadImage,
} from "../../config/gridfs";

import type {
    GridFSBucketReadStream,
    GridFSBucketWriteStream,
} from "mongodb";

export class GridFSServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
    ) {
        super(message);
        this.name = "GridFSServiceError";
    }
}

const ALLOWED_IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface ImageUploadInput {
    filename: string;
    contentType: string;
    buffer: Buffer;
}

export interface ImageUploadResult {
    fileId: string;
    filename: string;
    contentType: string;
    size: number;
}

function validateImage(input: ImageUploadInput): void {
    if (!input.filename.trim()) {
        throw new GridFSServiceError("Image filename is required.", 400);
    }

    if (!ALLOWED_IMAGE_TYPES.has(input.contentType.toLowerCase())) {
        throw new GridFSServiceError(
            "Only JPEG, PNG, and WebP images are allowed.",
            415,
        );
    }

    if (!Buffer.isBuffer(input.buffer) || input.buffer.length === 0) {
        throw new GridFSServiceError("The uploaded image is empty.", 400);
    }

    if (input.buffer.length > MAX_IMAGE_SIZE_BYTES) {
        throw new GridFSServiceError(
            "Image size must not exceed 5 MB.",
            413,
        );
    }
}

/**
 * Uploads an image to MongoDB GridFS.
 */
export async function saveImage(
    input: ImageUploadInput,
): Promise<ImageUploadResult> {
    validateImage(input);

    return new Promise<ImageUploadResult>((resolve, reject) => {
        let settled = false;

        const stream: GridFSBucketWriteStream = uploadImage(
            input.filename.trim(),
            input.contentType.toLowerCase(),
        );

        stream.once("error", (error: Error) => {
            if (settled) return;
            settled = true;

            reject(
                new GridFSServiceError(
                    `Image upload failed: ${error.message}`,
                    500,
                ),
            );
        });

        stream.once("finish", () => {
            if (settled) return;
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
export function getImageStream(
    fileId: string,
): GridFSBucketReadStream {
    try {
        return downloadImage(fileId);
    } catch (error: unknown) {
        if (error instanceof GridFSServiceError) {
            throw error;
        }

        throw new GridFSServiceError(
            "Unable to open the requested image.",
            400,
        );
    }
}

/**
 * Deletes an image from GridFS.
 */
export async function removeImage(fileId: string): Promise<void> {
    if (!fileId.trim()) {
        throw new GridFSServiceError("Image file ID is required.", 400);
    }

    try {
        await deleteImage(fileId);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "FileNotFound") {
            throw new GridFSServiceError("Image file was not found.", 404);
        }

        throw new GridFSServiceError(
            "Unable to delete the requested image.",
            500,
        );
    }
}
