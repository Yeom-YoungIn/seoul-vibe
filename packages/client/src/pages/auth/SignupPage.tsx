/**
 * 목적 - 회원가입 실패 메시지 처리와 완료 화면 전환을 단순하게 유지하기 위해 수정됨
 * 설명 - 공통 API 에러 헬퍼를 사용해 에러 해석을 통일하고, 가입 성공 시 이메일 인증 안내 화면으로 전환한다.
 */
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { getApiErrorMessage } from '../../lib/api/error';

export default function SignupPage() {
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Check your email</h2>
          <p>We sent a verification link to <strong>{form.email}</strong>.</p>
          <p>Please verify your email to continue.</p>
          <Link to="/auth/login" className="auth-link">Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Seoul Vibe</h1>
        <h2>Create account</h2>
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
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
          </label>
          <label>
            Nickname
            <input
              type="text"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              placeholder="seoulvibe_user"
              minLength={2}
              maxLength={50}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/auth/login" className="auth-link">Log in</Link>
        </p>
      </div>
    </div>
  );
}
