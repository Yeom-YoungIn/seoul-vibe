import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from 'react';
import { api, clearAuthStorage } from '../lib/axios';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  logout: () => void;
  refreshAuth: () => Promise<AuthUser | null>;
  isAdmin: boolean;
}

interface AuthSnapshot {
  initialized: boolean;
  user: AuthUser | null;
}

const authSnapshot: AuthSnapshot = {
  initialized: false,
  user: null,
};

let authRequest: Promise<AuthUser | null> | null = null;

const AuthContext = createContext<AuthContextValue | null>(null);

function readAccessToken() {
  return localStorage.getItem('accessToken');
}

async function fetchCurrentUser(force = false): Promise<AuthUser | null> {
  const token = readAccessToken();

  if (!token) {
    authSnapshot.initialized = true;
    authSnapshot.user = null;
    authRequest = null;
    return null;
  }

  if (!force && authSnapshot.initialized) {
    return authSnapshot.user;
  }

  if (!force && authRequest) {
    return authRequest;
  }

  authRequest = api
    .get<{ data: AuthUser }>('/auth/me')
    .then((res) => {
      authSnapshot.initialized = true;
      authSnapshot.user = res.data.data;
      return authSnapshot.user;
    })
    .catch(() => {
      clearAuthStorage();
      authSnapshot.initialized = true;
      authSnapshot.user = null;
      return null;
    })
    .finally(() => {
      authRequest = null;
    });

  return authRequest;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(authSnapshot.user);
  const [loading, setLoading] = useState(!authSnapshot.initialized);

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((nextUser) => {
        if (!active) return;
        setUser(nextUser);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshAuth = async () => {
    setLoading(true);
    const nextUser = await fetchCurrentUser(true);
    setUser(nextUser);
    setLoading(false);
    return nextUser;
  };

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api
        .post('/auth/logout', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        .catch(() => {});
    }

    clearAuthStorage();
    authSnapshot.initialized = true;
    authSnapshot.user = null;
    authRequest = null;
    setUser(null);
    setLoading(false);
  };

  const value: AuthContextValue = {
    user,
    loading,
    logout,
    refreshAuth,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return value;
}
