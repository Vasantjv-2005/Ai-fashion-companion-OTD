
import type {
    GridFSBucketReadStream,
    GridFSBucketWriteStream,
} from "mongodb";

export interface GridFSUploadInput {
    filename: string;
    contentType: string;
    buffer: Buffer;
}

export interface GridFSUploadResult {
    fileId: string;
    filename: string;
    contentType: string;
    size: number;
}

export interface GridFSFileMetadata {
    contentType: string;
    uploadedAt: Date;
}

export interface GridFSDownloadResult {
    fileId: string;
    stream: GridFSBucketReadStream;
    contentType?: string;
    filename?: string;
    size?: number;
}

export interface GridFSDeleteResult {
    fileId: string;
    deleted: boolean;
}

export type GridFSUploadStream = GridFSBucketWriteStream;
export type GridFSReadStream = GridFSBucketReadStream;

export type SupportedImageMimeType =
    | "image/jpeg"
    | "image/png"
    | "image/webp";
