import { createContext } from 'react';
import type { AuthContextValue } from '../types/domain/auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

