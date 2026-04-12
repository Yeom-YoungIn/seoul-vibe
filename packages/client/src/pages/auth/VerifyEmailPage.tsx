import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/axios';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    api
      .get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        {status === 'loading' && <p>Verifying your email…</p>}
        {status === 'success' && (
          <>
            <h2>Email verified!</h2>
            <p>Your account is now active. You can log in.</p>
            <Link to="/auth/login" className="auth-button" style={{ display: 'inline-block', marginTop: 16 }}>
              Go to login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h2>Verification failed</h2>
            <p>The link is invalid or has expired. Please sign up again.</p>
            <Link to="/auth/signup" className="auth-link">Back to sign up</Link>
          </>
        )}
      </div>
    </div>
  );
}
