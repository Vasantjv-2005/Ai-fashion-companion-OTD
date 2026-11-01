import type { Response } from "express";
import type { PaginationMeta } from "../types/common.types";

export class ApiResponse<T = unknown> {
    public readonly statusCode: number;
    public readonly data?: T;
    public readonly message: string;
    public readonly success: boolean;
    public readonly meta?: Record<string, unknown> | PaginationMeta;

    constructor(
        statusCode: number,
        data?: T,
        message: string = "Success",
        meta?: Record<string, unknown> | PaginationMeta,
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 300;
        this.meta = meta;
    }

    public send(res: Response): Response {
        const body: Record<string, unknown> = {
            success: this.success,
            message: this.message,
        };

        if (this.data !== undefined) {
            body.data = this.data;
        }

        if (this.meta !== undefined) {
            body.meta = this.meta;
        }

        return res.status(this.statusCode).json(body);
    }

    static success<T>(
        res: Response,
        data: T,
        message: string = "Success",
        statusCode: number = 200,
        meta?: Record<string, unknown> | PaginationMeta,
    ): Response {
        return new ApiResponse(statusCode, data, message, meta).send(res);
    }

    static created<T>(
        res: Response,
        data: T,
        message: string = "Created successfully",
    ): Response {
        return new ApiResponse(201, data, message).send(res);
    }

    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    static paginated<T>(
        res: Response,
        data: T[],
        pagination: PaginationMeta,
        message: string = "Success",
    ): Response {
        return res.status(200).json({
            success: true,
            data,
            pagination,
            message,
        });
    }
}

export default ApiResponse;

