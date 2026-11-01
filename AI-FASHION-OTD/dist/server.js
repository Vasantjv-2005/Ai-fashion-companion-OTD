"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const database_1 = require("./config/database");
const PORT = Number(process.env.PORT) || 5000;
const SHUTDOWN_TIMEOUT_MS = 10_000;
async function startServer() {
    try {
        // Connect to MongoDB before starting the HTTP server.
        await (0, database_1.connectDB)();
        const server = app_1.default.listen(PORT, () => {
            console.log(`🚀 AI Fashion Companion API running on port ${PORT}`);
            console.log(`❤️ Health check: http://localhost:${PORT}/health`);
        });
        let isShuttingDown = false;
        const shutdown = (signal) => {
            if (isShuttingDown) {
                return;
            }
            isShuttingDown = true;
            console.log(`${signal} received. Shutting down gracefully...`);
            const forceShutdownTimer = setTimeout(() => {
                console.error("Forced shutdown after timeout.");
                process.exit(1);
            }, SHUTDOWN_TIMEOUT_MS);
            forceShutdownTimer.unref();
            server.close(async (error) => {
                if (error) {
                    console.error("Error closing HTTP server:", error);
                    process.exitCode = 1;
                }
                else {
                    console.log("HTTP server closed.");
                }
                try {
                    await (0, database_1.disconnectDB)();
                }
                catch (disconnectError) {
                    console.error("Error disconnecting from MongoDB:", disconnectError);
                    process.exitCode = 1;
                }
                finally {
                    clearTimeout(forceShutdownTimer);
                    process.exit(process.exitCode ?? 0);
                }
            });
        };
        process.once("SIGTERM", () => shutdown("SIGTERM"));
        process.once("SIGINT", () => shutdown("SIGINT"));
    }
    catch (error) {
        console.error("Failed to start the server:", error);
        try {
            await (0, database_1.disconnectDB)();
        }
        catch (disconnectError) {
            console.error("Failed to disconnect from MongoDB:", disconnectError);
        }
        process.exit(1);
    }
}
void startServer();
