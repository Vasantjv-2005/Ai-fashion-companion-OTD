/**
 * Frontend authentication domain types for OTD Web.
 * Strictly decoupled from raw backend API DTOs.
 */

export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'guest'
  | 'unauthenticated';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

/** Alias preserved for component compatibility during gradual Phase 2/7 migration. */
export type AuthSuccessData = AuthSession;

export interface AuthResult<T = AuthSession> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
  isNetworkError?: boolean;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isInitializing: boolean;
  canAccessStudio: boolean;
  canMakeProtectedRequests: boolean;
  getAccessToken: () => string | null;
  login: (credentials: LoginCredentials) => Promise<AuthResult<AuthSession>>;
  register: (credentials: RegisterCredentials) => Promise<AuthResult<AuthSession>>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResult<AuthSession>>;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

