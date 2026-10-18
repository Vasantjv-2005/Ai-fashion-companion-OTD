
export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthenticatedUser {
    id: string;
    name: string;
    email: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

export interface AuthResult {
    user: AuthenticatedUser;
    tokens: AuthTokens;
}

export interface JwtAccessTokenPayload {
    sub: string;
    email: string;
    type: "access";
}

export interface JwtRefreshTokenPayload {
    sub: string;
    type: "refresh";
    jti: string;
}

export interface AuthenticatedRequestUser {
    id: string;
    email: string;
}
