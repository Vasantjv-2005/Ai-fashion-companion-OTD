import argon2 from "argon2";
import { AUTH_CONSTANTS } from "../constants/auth.constants";

export async function hashPassword(password: string): Promise<string> {
    if (!password || password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH) {
        throw new Error(
            `Password must be at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters long.`,
        );
    }
    return argon2.hash(password);
}

export async function verifyPassword(
    hash: string,
    plain: string,
): Promise<boolean> {
    if (!hash || !plain) {
        return false;
    }
    try {
        return await argon2.verify(hash, plain);
    } catch {
        return false;
    }
}

export function isStrongPassword(password: string): boolean {
    if (
        !password ||
        password.length < AUTH_CONSTANTS.PASSWORD_MIN_LENGTH ||
        password.length > AUTH_CONSTANTS.PASSWORD_MAX_LENGTH
    ) {
        return false;
    }

    // Must contain lowercase, uppercase, and digit
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);

    return hasLower && hasUpper && hasDigit;
}

