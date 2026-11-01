"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnecting = false;
async function connectDB() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error("MONGODB_URI is missing. Add your MongoDB connection string to .env.");
    }
    if (mongoose_1.default.connection.readyState === 1) {
        console.log("MongoDB is already connected.");
        return;
    }
    if (isConnecting) {
        throw new Error("A MongoDB connection attempt is already in progress.");
    }
    isConnecting = true;
    try {
        await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 10_000,
        });
        console.log("MongoDB connected successfully.");
    }
    catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
    finally {
        isConnecting = false;
    }
}
async function disconnectDB() {
    if (mongoose_1.default.connection.readyState !== 0) {
        await mongoose_1.default.disconnect();
        console.log("MongoDB disconnected.");
    }
}
