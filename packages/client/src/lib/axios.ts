import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Access Token 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 시 Refresh Token으로 갱신
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, null, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        });
        const { accessToken, refreshToken: newRefresh } = data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
