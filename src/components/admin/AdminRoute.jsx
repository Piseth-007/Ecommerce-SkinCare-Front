import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/admin/login" />;

  if (user.role !== "admin") {
    return <div>Access denied — admin only.</div>;
  }

  return children;
}
