
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../context/useAuth";

function ProtectedRoute() {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
