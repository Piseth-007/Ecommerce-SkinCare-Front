import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-8 text-stone text-sm">Loading…</div>;
  if (!user) return <Navigate to="/login" />;

  return children;
}
