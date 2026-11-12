import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { authService } from '../services/auth.service';
import {
  clearMemoryAuthSession,
  getAccessToken,
  getSessionEpoch,
  subscribeAuthSessionEvents,
} from '../services/authSession';
import type {
  AuthResult,
  AuthSession,
  AuthStatus,
  AuthUser,
  LoginCredentials,
  RegisterCredentials,
} from '../types/domain/auth';
import {
  clearPrivateUserCaches,
  isGuestDemoSessionActive,
  normalizeAuthUserId,
  setActivePrivateCacheOwnerId,
  setGuestDemoSessionActive,
} from '../utils/authStorage';
import { AuthContext } from './AuthContextInstance';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>(() =>
    isGuestDemoSessionActive() ? 'guest' : 'initializing'
  );
  const [user, setUser] = useState<AuthUser | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<AuthStatus>(status);
  const userRef = useRef<AuthUser | null>(user);

  const commitAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    const outgoingUserId = normalizeAuthUserId(userRef.current?.id);
    const incomingUserId = normalizeAuthUserId(nextUser.id);
    if (outgoingUserId && outgoingUserId !== incomingUserId) {
      clearPrivateUserCaches({ userId: outgoingUserId, preserveGuestSession: false });
    }
    setActivePrivateCacheOwnerId(incomingUserId);
    setGuestDemoSessionActive(false);
    userRef.current = nextUser;
    statusRef.current = 'authenticated';
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return subscribeAuthSessionEvents({
      onSessionRefreshed: (session) => {
        if (!mountedRef.current || statusRef.current !== 'authenticated') {
          return;
        }
        commitAuthenticatedUser(session.user);
      },
      onSessionInvalidated: () => {
        if (!mountedRef.current || statusRef.current !== 'authenticated') {
          return;
        }
        const outgoingUserId = normalizeAuthUserId(userRef.current?.id);
        clearMemoryAuthSession();
        clearPrivateUserCaches({ userId: outgoingUserId });
        setGuestDemoSessionActive(false);
        userRef.current = null;
        statusRef.current = 'unauthenticated';
        setUser(null);
        setStatus('unauthenticated');
      },
    });
  }, [commitAuthenticatedUser]);

  useEffect(() => {
    if (isGuestDemoSessionActive()) {
      return;
    }

    const epochAtStart = getSessionEpoch();
    let cancelled = false;

    void authService.bootstrapRefresh().then((result) => {
      if (cancelled || !mountedRef.current || epochAtStart !== getSessionEpoch()) {
        return;
      }

      if (result.success && result.data) {
        commitAuthenticatedUser(result.data.user);
      } else {
        userRef.current = null;
        const fallbackStatus: AuthStatus = isGuestDemoSessionActive() ? 'guest' : 'unauthenticated';
        statusRef.current = fallbackStatus;
        setUser(null);
        setStatus(fallbackStatus);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [commitAuthenticatedUser]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResult<AuthSession>> => {
      const result = await authService.login(credentials);
      if (!mountedRef.current) return result;

      if (result.success && result.data) {
        commitAuthenticatedUser(result.data.user);
      }
      return result;
    },
    [commitAuthenticatedUser]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<AuthResult<AuthSession>> => {
      const result = await authService.register(credentials);
      if (!mountedRef.current) return result;

      if (result.success && result.data) {
        commitAuthenticatedUser(result.data.user);
      }
      return result;
    },
    [commitAuthenticatedUser]
  );

  const refreshSession = useCallback(async (): Promise<AuthResult<AuthSession>> => {
    const epochAtStart = getSessionEpoch();
    const result = await authService.refresh();
    if (!mountedRef.current || epochAtStart !== getSessionEpoch()) {
      return result;
    }

    if (result.success && result.data) {
      commitAuthenticatedUser(result.data.user);
    } else {
      const outgoingUserId = normalizeAuthUserId(userRef.current?.id);
      if (outgoingUserId) {
        clearMemoryAuthSession();
        clearPrivateUserCaches({ userId: outgoingUserId, preserveGuestSession: isGuestDemoSessionActive() });
      }
      userRef.current = null;
      const nextStatus: AuthStatus = statusRef.current === 'guest' ? 'guest' : 'unauthenticated';
      statusRef.current = nextStatus;
      setUser(null);
      setStatus((prev) => (prev === 'guest' ? 'guest' : 'unauthenticated'));
    }
    return result;
  }, [commitAuthenticatedUser]);

  const logout = useCallback(async (): Promise<void> => {
    const outgoingUserId = normalizeAuthUserId(userRef.current?.id);
    try {
      await authService.logout();
    } finally {
      clearMemoryAuthSession();
      clearPrivateUserCaches({ userId: outgoingUserId });
      setGuestDemoSessionActive(false);
      userRef.current = null;
      statusRef.current = 'unauthenticated';
      if (mountedRef.current) {
        setUser(null);
        setStatus('unauthenticated');
      }
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    const outgoingUserId = normalizeAuthUserId(userRef.current?.id);
    clearMemoryAuthSession();
    clearPrivateUserCaches({ userId: outgoingUserId, preserveGuestSession: true });
    setGuestDemoSessionActive(true);
    userRef.current = null;
    statusRef.current = 'guest';
    setUser(null);
    setStatus('guest');
  }, []);

  const exitGuestMode = useCallback(() => {
    setGuestDemoSessionActive(false);
    if (statusRef.current !== 'authenticated') {
      userRef.current = null;
      statusRef.current = 'unauthenticated';
    }
    setUser((prev) => (statusRef.current === 'authenticated' ? prev : null));
    setStatus((prev) => (prev === 'authenticated' ? prev : 'unauthenticated'));
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      isGuest: status === 'guest',
      isInitializing: status === 'initializing',
      canAccessStudio: status === 'authenticated' || status === 'guest',
      canMakeProtectedRequests:
        status === 'authenticated' && Boolean(getAccessToken()),
      getAccessToken,
      login,
      register,
      logout,
      refreshSession,
      enterGuestMode,
      exitGuestMode,
    }),
    [
      status,
      user,
      login,
      register,
      logout,
      refreshSession,
      enterGuestMode,
      exitGuestMode,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

