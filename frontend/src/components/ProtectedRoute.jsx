import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard
    switch (user.role) {
      case "ADMIN":
        return <Navigate to="/admin" replace />;
      case "ORGANIZER":
        return <Navigate to="/organizer" replace />;
      case "PARTICIPANT":
        return <Navigate to="/participant" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
}