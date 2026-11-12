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

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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
        setUser(session.user);
      },
      onSessionInvalidated: () => {
        if (!mountedRef.current || statusRef.current !== 'authenticated') {
          return;
        }
        clearMemoryAuthSession();
        clearPrivateUserCaches();
        setGuestDemoSessionActive(false);
        setUser(null);
        setStatus('unauthenticated');
      },
    });
  }, []);

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
        setGuestDemoSessionActive(false);
        setUser(result.data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus(isGuestDemoSessionActive() ? 'guest' : 'unauthenticated');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthResult<AuthSession>> => {
      const result = await authService.login(credentials);
      if (!mountedRef.current) return result;

      if (result.success && result.data) {
        setGuestDemoSessionActive(false);
        setUser(result.data.user);
        setStatus('authenticated');
      }
      return result;
    },
    []
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<AuthResult<AuthSession>> => {
      const result = await authService.register(credentials);
      if (!mountedRef.current) return result;

      if (result.success && result.data) {
        setGuestDemoSessionActive(false);
        setUser(result.data.user);
        setStatus('authenticated');
      }
      return result;
    },
    []
  );

  const refreshSession = useCallback(async (): Promise<AuthResult<AuthSession>> => {
    const epochAtStart = getSessionEpoch();
    const result = await authService.refresh();
    if (!mountedRef.current || epochAtStart !== getSessionEpoch()) {
      return result;
    }

    if (result.success && result.data) {
      setGuestDemoSessionActive(false);
      setUser(result.data.user);
      setStatus('authenticated');
    } else {
      setUser(null);
      setStatus((prev) => (prev === 'guest' ? 'guest' : 'unauthenticated'));
    }
    return result;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } finally {
      clearMemoryAuthSession();
      clearPrivateUserCaches();
      setGuestDemoSessionActive(false);
      if (mountedRef.current) {
        setUser(null);
        setStatus('unauthenticated');
      }
    }
  }, []);

  const enterGuestMode = useCallback(() => {
    clearMemoryAuthSession();
    setGuestDemoSessionActive(true);
    setUser(null);
    setStatus('guest');
  }, []);

  const exitGuestMode = useCallback(() => {
    setGuestDemoSessionActive(false);
    setUser(null);
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

