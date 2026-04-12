import { Navigate, Outlet } from 'react-router-dom';
import Spinner from './Spinner';
import { useAuth } from '../../hooks/useAuth';

export default function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}
