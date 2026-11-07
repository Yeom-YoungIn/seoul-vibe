import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/axios';
import { getApiErrorMessage } from '../../lib/api/error';
import AuthShell from '../../components/layouts/AuthShell';

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
      <AuthShell>
        <h1 className="auth-heading">Check your email</h1>
        <p>
          We sent a verification link to <strong>{form.email}</strong>.
        </p>
        <p>Please verify your email to continue.</p>
        <Link to="/auth/login" className="auth-link">
          Back to login
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="auth-heading">Create account</h1>
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
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary auth-button">
          {loading ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="auth-footer">
        Already have an account?{' '}
        <Link to="/auth/login" className="auth-link">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
