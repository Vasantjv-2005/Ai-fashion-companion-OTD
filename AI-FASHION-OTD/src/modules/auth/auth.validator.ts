
import { z } from "zod";
import { AUTH_CONSTANTS } from "../../constants/auth.constants";

export const registerSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Name must contain at least 2 characters.")
            .max(100, "Name cannot exceed 100 characters."),

        email: z
            .string()
            .trim()
            .min(1, "Email is required.")
            .max(AUTH_CONSTANTS.EMAIL_MAX_LENGTH, "Email is too long.")
            .email("Enter a valid email address.")
            .transform((value) => value.toLowerCase()),

        password: z
            .string()
            .min(
                AUTH_CONSTANTS.PASSWORD_MIN_LENGTH,
                `Password must contain at least ${AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters.`,
            )
            .max(
                AUTH_CONSTANTS.PASSWORD_MAX_LENGTH,
                `Password cannot exceed ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.`,
            ),
    })
    .strict();

export const loginSchema = z
    .object({
        email: z
            .string()
            .trim()
            .min(1, "Email is required.")
            .max(AUTH_CONSTANTS.EMAIL_MAX_LENGTH, "Email is too long.")
            .email("Enter a valid email address.")
            .transform((value) => value.toLowerCase()),

        password: z
            .string()
            .min(1, "Password is required.")
            .max(
                AUTH_CONSTANTS.PASSWORD_MAX_LENGTH,
                `Password cannot exceed ${AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.`,
            ),
    })
    .strict();

export const refreshTokenSchema = z
    .object({
        refreshToken: z.string().min(1, "Refresh token is required."),
    })
    .strict();

export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;

export function validateRegistration(input: unknown): RegisterRequest {
    return registerSchema.parse(input);
}

export function validateLogin(input: unknown): LoginRequest {
    return loginSchema.parse(input);
}

export function validateRefreshToken(input: unknown): RefreshTokenRequest {
    return refreshTokenSchema.parse(input);
}
