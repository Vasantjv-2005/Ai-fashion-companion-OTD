
type LogLevel = "info" | "warn" | "error" | "debug";

function writeLog(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
): void {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...(context ? { context } : {}),
    };

    const output = JSON.stringify(entry);

    switch (level) {
        case "error":
            console.error(output);
            break;
        case "warn":
            console.warn(output);
            break;
        case "debug":
            if (process.env.NODE_ENV !== "production") {
                console.debug(output);
            }
            break;
        default:
            console.info(output);
    }
}

export const logger = {
    info(message: string, context?: Record<string, unknown>): void {
        writeLog("info", message, context);
    },

    warn(message: string, context?: Record<string, unknown>): void {
        writeLog("warn", message, context);
    },

    error(message: string, context?: Record<string, unknown>): void {
        writeLog("error", message, context);
    },

    debug(message: string, context?: Record<string, unknown>): void {
        writeLog("debug", message, context);
    },
};

export default logger;
