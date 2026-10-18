
import mongoose from "mongoose";

let isConnecting = false;

export async function connectDB(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error(
            "MONGODB_URI is missing. Add your MongoDB connection string to .env.",
        );
    }

    if (mongoose.connection.readyState === 1) {
        console.log("MongoDB is already connected.");
        return;
    }

    if (isConnecting) {
        throw new Error("A MongoDB connection attempt is already in progress.");
    }

    isConnecting = true;

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 10_000,
        });

        console.log("MongoDB connected successfully.");
    } catch (error: unknown) {
        console.error("MongoDB connection failed:", error);
        throw error;
    } finally {
        isConnecting = false;
    }
}

export async function disconnectDB(): Promise<void> {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
}
