import type { BackendAuthResponseDto, BackendAuthUserDto } from '../types/api/auth.dto';
import type { AuthSession, AuthUser } from '../types/domain/auth';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!isRecord(raw)) return null;

  const dto = raw as BackendAuthUserDto;
  const idCandidate =
    typeof dto.id === 'string' && dto.id.trim()
      ? dto.id.trim()
      : typeof dto._id === 'string' && dto._id.trim()
        ? dto._id.trim()
        : '';

  const nameCandidate = typeof dto.name === 'string' ? dto.name.trim() : '';
  const emailCandidate = typeof dto.email === 'string' ? dto.email.trim() : '';

  if (!idCandidate || !nameCandidate || !emailCandidate) {
    return null;
  }

  return {
    id: idCandidate,
    name: nameCandidate,
    email: emailCandidate,
    createdAt: typeof dto.createdAt === 'string' ? dto.createdAt : undefined,
  };
}

/**
 * Normalizes backend auth payloads cleanly.
 * Supports current flat `{ success, message, user, accessToken }` format directly
 * while also defensively tolerating nested `data: { user, accessToken }` wrappers.
 */
export function normalizeAuthSuccessPayload(raw: unknown): {
  session: AuthSession | null;
  message?: string;
} {
  if (!isRecord(raw)) {
    return { session: null };
  }

  const dto = raw as BackendAuthResponseDto;
  const message = typeof dto.message === 'string' ? dto.message : undefined;

  const rawUser = dto.user ?? dto.data?.user;
  const rawAccessToken =
    typeof dto.accessToken === 'string' && dto.accessToken.trim()
      ? dto.accessToken.trim()
      : typeof dto.data?.accessToken === 'string' && dto.data.accessToken.trim()
        ? dto.data.accessToken.trim()
        : '';

  const user = normalizeAuthUser(rawUser);
  if (!user || !rawAccessToken) {
    return { session: null, message };
  }

  return {
    session: {
      user,
      accessToken: rawAccessToken,
    },
    message,
  };
}

export type AuthErrorOperation = 'login' | 'register' | 'refresh' | 'logout';

export function extractBackendMessage(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  return typeof raw.message === 'string' && raw.message.trim()
    ? raw.message.trim()
    : null;
}

export function normalizeAuthErrorMessage(
  status: number,
  raw: unknown,
  operation: AuthErrorOperation
): string {
  const serverMessage = extractBackendMessage(raw);
  if (serverMessage) {
    return serverMessage;
  }

  if (status === 400) {
    return 'Please verify the details entered and try again.';
  }
  if (status === 401) {
    return operation === 'refresh'
      ? 'Your session has expired. Please sign in again.'
      : 'Invalid email or password.';
  }
  if (status === 403) {
    return 'This account cannot be accessed right now.';
  }
  if (status === 409) {
    return 'An account with this email already exists.';
  }
  if (status === 429) {
    return 'Too many authentication attempts. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Authentication server is currently unavailable. Please try again later.';
  }

  if (operation === 'login') return `Login failed with status ${status}.`;
  if (operation === 'register') return `Registration failed with status ${status}.`;
  if (operation === 'refresh') return `Session restoration failed with status ${status}.`;
  return `Logout failed with status ${status}.`;
}

