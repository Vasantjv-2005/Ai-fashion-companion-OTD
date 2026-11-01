export * from "../modules/auth/auth.types";

export interface UserSession {
    userId: string;
    email: string;
    role?: "user" | "admin";
    createdAt?: Date;
}

export interface DecodedToken {
    sub: string;
    email: string;
    type: "access" | "refresh";
    iat?: number;
    exp?: number;
    jti?: string;
}

