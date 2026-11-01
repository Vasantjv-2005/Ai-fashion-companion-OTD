"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.isStrongPassword = isStrongPassword;
const argon2_1 = __importDefault(require("argon2"));
const auth_constants_1 = require("../constants/auth.constants");
async function hashPassword(password) {
    if (!password || password.length < auth_constants_1.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
        throw new Error(`Password must be at least ${auth_constants_1.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long.`);
    }
    return argon2_1.default.hash(password);
}
async function verifyPassword(hash, plain) {
    if (!hash || !plain) {
        return false;
    }
    try {
        return await argon2_1.default.verify(hash, plain);
    }
    catch {
        return false;
    }
}
function isStrongPassword(password) {
    if (!password ||
        password.length < auth_constants_1.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH ||
        password.length > auth_constants_1.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH) {
        return false;
    }
    // Must contain lowercase, uppercase, and digit
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);
    return hasLower && hasUpper && hasDigit;
}
