"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    statusCode;
    data;
    message;
    success;
    meta;
    constructor(statusCode, data, message = "Success", meta) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode >= 200 && statusCode < 300;
        this.meta = meta;
    }
    send(res) {
        const body = {
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
    static success(res, data, message = "Success", statusCode = 200, meta) {
        return new ApiResponse(statusCode, data, message, meta).send(res);
    }
    static created(res, data, message = "Created successfully") {
        return new ApiResponse(201, data, message).send(res);
    }
    static noContent(res) {
        return res.status(204).send();
    }
    static paginated(res, data, pagination, message = "Success") {
        return res.status(200).json({
            success: true,
            data,
            pagination,
            message,
        });
    }
}
exports.ApiResponse = ApiResponse;
exports.default = ApiResponse;
