/**
 * 목적 - 로그인 실패 메시지 처리와 인증 후 이동 흐름을 안정적으로 유지하기 위해 수정됨
 * 설명 - 공통 API 에러 헬퍼를 사용해 사용자 메시지를 통일하고, 로그인 성공 시 토큰 저장과 권한별 라우팅을 수행한다.
 */
import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useAuth } from '../../hooks/useAuth';
import { getApiErrorMessage } from '../../lib/api/error';

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshAuth } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      const user = await refreshAuth();
      navigate(user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Seoul Vibe</h1>
        <h2>Welcome back</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="auth-footer">
          No account? <Link to="/auth/signup" className="auth-link">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
