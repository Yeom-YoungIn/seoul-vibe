import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Spinner from './Spinner';

export default function AdminRoute() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
