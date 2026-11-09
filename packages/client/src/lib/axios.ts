import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

/** 서버가 돌려준 상대 경로(/uploads/...)를 API 호스트 기준 URL로 바꾼다 */
export const assetUrl = (path: string): string =>
  /^https?:\/\//.test(path) ? path : `${BASE_URL.replace(/\/$/, '')}${path}`;

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

export function clearAuthStorage() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

function redirectToLogin(error: unknown) {
  clearAuthStorage();
  window.location.href = '/auth/login';
  return Promise.reject(error);
}

// 서버가 refresh 토큰을 1회용으로 회전시키므로 동시에 난 401들은 같은 갱신 요청을 기다린다
let refreshRequest: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  refreshRequest ??= axios
    .post(`${BASE_URL}/auth/refresh`, null, {
      headers: { Authorization: `Bearer ${refreshToken}` },
    })
    .then(({ data }) => {
      const { accessToken, refreshToken: newRefresh } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefresh);
      return accessToken as string;
    })
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
}

// 401 시 Refresh Token으로 갱신
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return redirectToLogin(error);
      try {
        const accessToken = await refreshAccessToken(refreshToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        return redirectToLogin(error);
      }
    }
    return Promise.reject(error);
  },
);
