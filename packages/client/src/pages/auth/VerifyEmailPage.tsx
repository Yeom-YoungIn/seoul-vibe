import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/axios';
import AuthShell from '../../components/layouts/AuthShell';

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
    <AuthShell>
      {status === 'loading' && <p>Verifying your email…</p>}
      {status === 'success' && (
        <>
          <h1 className="auth-heading">Email verified!</h1>
          <p>Your account is now active. You can log in.</p>
          <Link to="/auth/login" className="btn btn-primary auth-button">
            Go to login
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="auth-heading">Verification failed</h1>
          <p>The link is invalid or has expired. Please sign up again.</p>
          <Link to="/auth/signup" className="auth-link">
            Back to sign up
          </Link>
        </>
      )}
    </AuthShell>
  );
}
