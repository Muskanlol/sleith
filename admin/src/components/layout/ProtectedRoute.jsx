import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../utils/constants";

function getDefaultRouteForRole(role) {
  if (role === ROLES.STAFF) return "/admin/services";
  if (role === ROLES.TRAINER) return "/admin/academy/students";
  return "/admin/dashboard";
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-sidebar-bg">
        <div className="text-accent">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (user?.role === "CUSTOMER") {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
  }

  return children;
}

export default ProtectedRoute;