import "dotenv/config";

import app from "./app";
import { connectDB, disconnectDB } from "./config/database";

const PORT = Number(process.env.PORT) || 5000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

async function startServer(): Promise<void> {
    try {
        // Connect to MongoDB before starting the HTTP server.
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(
                `🚀 AI Fashion Companion API running on port ${PORT}`,
            );
            console.log(
                `❤️ Health check: http://localhost:${PORT}/health`,
            );
        });

        let isShuttingDown = false;

        const shutdown = (signal: string): void => {
            if (isShuttingDown) {
                return;
            }

            isShuttingDown = true;

            console.log(
                `${signal} received. Shutting down gracefully...`,
            );

            const forceShutdownTimer = setTimeout(() => {
                console.error("Forced shutdown after timeout.");
                process.exit(1);
            }, SHUTDOWN_TIMEOUT_MS);

            forceShutdownTimer.unref();

            server.close(async (error) => {
                if (error) {
                    console.error("Error closing HTTP server:", error);
                    process.exitCode = 1;
                } else {
                    console.log("HTTP server closed.");
                }

                try {
                    await disconnectDB();
                } catch (disconnectError: unknown) {
                    console.error(
                        "Error disconnecting from MongoDB:",
                        disconnectError,
                    );

                    process.exitCode = 1;
                } finally {
                    clearTimeout(forceShutdownTimer);
                    process.exit(process.exitCode ?? 0);
                }
            });
        };

        process.once("SIGTERM", () => shutdown("SIGTERM"));
        process.once("SIGINT", () => shutdown("SIGINT"));
    } catch (error: unknown) {
        console.error("Failed to start the server:", error);

        try {
            await disconnectDB();
        } catch (disconnectError: unknown) {
            console.error(
                "Failed to disconnect from MongoDB:",
                disconnectError,
            );
        }

        process.exit(1);
    }
}

void startServer();