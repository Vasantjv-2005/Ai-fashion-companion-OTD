"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function writeLog(level, message, context) {
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
exports.logger = {
    info(message, context) {
        writeLog("info", message, context);
    },
    warn(message, context) {
        writeLog("warn", message, context);
    },
    error(message, context) {
        writeLog("error", message, context);
    },
    debug(message, context) {
        writeLog("debug", message, context);
    },
};
exports.default = exports.logger;
