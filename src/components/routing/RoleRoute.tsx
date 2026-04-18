import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import RoleSelection from '@/pages/RoleSelection';

interface RoleRouteProps {
  requiredRole?: string;
}

export function RoleRoute({ requiredRole }: RoleRouteProps) {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles.length === 0) {
    return <RoleSelection />;
  }

  if (requiredRole && !roles.includes(requiredRole as any)) {
    // If they go to wrong route, redirect them to their actual dashboard
    if (roles.includes('admin')) return <Navigate to="/admin" replace />;
    if (roles.includes('warehouse')) return <Navigate to="/warehouse" replace />;
    if (roles.includes('vendor')) return <Navigate to="/vendor" replace />;
    return <Navigate to="/consumer" replace />;
  }

  // Proper way of redirecting into nested section via Outlet
  return <Outlet />;
}
