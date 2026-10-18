
import "dotenv/config";

import app from "./app";
import { connectDB } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;

async function startServer(): Promise<void> {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`🚀 AI Fashion Companion API running on port ${PORT}`);
            console.log(`❤️ Health check: http://localhost:${PORT}/health`);
        });

        const shutdown = (signal: string): void => {
            console.log(`${signal} received. Shutting down gracefully...`);

            server.close(() => {
                console.log("HTTP server closed.");
                process.exit(0);
            });

            setTimeout(() => {
                console.error("Forced shutdown after timeout.");
                process.exit(1);
            }, 10_000).unref();
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error: unknown) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
}

void startServer();
