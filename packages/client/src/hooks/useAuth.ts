import { useEffect, useState } from 'react';
import { api } from '../lib/axios';

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  role: 'user' | 'admin';
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ data: AuthUser }>('/auth/me')
      .then((res) => setUser(res.data.data))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      api
        .post('/auth/logout', null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        .catch(() => {});
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return { user, loading, logout, isAdmin };
}
