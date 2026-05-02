import { Navigate, Outlet } from 'react-router-dom';
import Spinner from './Spinner';
import { useAuth } from '../../hooks/useAuth';

export default function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
