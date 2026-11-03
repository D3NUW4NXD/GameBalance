import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading GameBalance...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
  return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;