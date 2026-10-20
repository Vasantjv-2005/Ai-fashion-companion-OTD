import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable, Writable } from "node:stream";

const mocks = vi.hoisted(() => ({
    uploadImage: vi.fn(),
    downloadImage: vi.fn(),
    deleteImage: vi.fn(),
}));

vi.mock("../../src/config/gridfs", () => ({
    uploadImage: mocks.uploadImage,
    downloadImage: mocks.downloadImage,
    deleteImage: mocks.deleteImage,
}));

import {
    saveImage,
    getImageStream,
    removeImage,
} from "../../src/integrations/storage/gridfs.service";

describe("GridFS integration tests", () => {
    const validImage = {
        buffer: Buffer.from("fake-image-content"),
        filename: "shirt.png",
        contentType: "image/png",
    };

    const createUploadStream = () => {
        const stream = new Writable({
            write(_chunk, _encoding, callback) {
                callback();
            },
        });

        Object.assign(stream, {
            id: "507f1f77bcf86cd799439011",
        });


        return stream;
    };

    beforeEach(() => {
        vi.resetAllMocks();

        mocks.uploadImage.mockImplementation(() => createUploadStream());

        mocks.downloadImage.mockResolvedValue(
            Readable.from(Buffer.from("fake-image-content"))
        );

        mocks.deleteImage.mockResolvedValue(undefined);
    });

    describe("saveImage", () => {
        it("uploads a valid image successfully", async () => {
            const result = await saveImage(validImage);

            expect(mocks.uploadImage).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it("rejects unsupported image MIME types", async () => {
            await expect(
                saveImage({
                    ...validImage,
                    contentType: "application/pdf",
                })
            ).rejects.toThrow();

            expect(mocks.uploadImage).not.toHaveBeenCalled();
        });

        it("accepts JPEG images", async () => {
            await expect(
                saveImage({
                    ...validImage,
                    contentType: "image/jpeg",
                })
            ).resolves.toBeDefined();
        });

        it("accepts WebP images", async () => {
            await expect(
                saveImage({
                    ...validImage,
                    contentType: "image/webp",
                })
            ).resolves.toBeDefined();
        });

        it("propagates storage upload failures", async () => {
            mocks.uploadImage.mockImplementation(() => {
                throw new Error("Storage upload failed");
            });

            await expect(saveImage(validImage)).rejects.toThrow();
        });
    });

    describe("getImageStream", () => {
        it("returns the image stream", async () => {
            const fileId = "507f1f77bcf86cd799439011";

            const result = await getImageStream(fileId);

            expect(mocks.downloadImage).toHaveBeenCalledWith(fileId);
            expect(result).toBeInstanceOf(Readable);
        });

        it("propagates image download failures", async () => {
            mocks.downloadImage.mockRejectedValue(
                new Error("Image not found")
            );

            await expect(
                getImageStream("507f1f77bcf86cd799439011")
            ).rejects.toThrow();
        });
    });

    describe("removeImage", () => {
        it("deletes an image successfully", async () => {
            const fileId = "507f1f77bcf86cd799439011";

            await removeImage(fileId);

            expect(mocks.deleteImage).toHaveBeenCalledWith(fileId);
        });

        it("propagates image deletion failures", async () => {
            mocks.deleteImage.mockRejectedValue(
                new Error("Image deletion failed")
            );

            await expect(
                removeImage("507f1f77bcf86cd799439011")
            ).rejects.toThrow();
        });
    });
});
