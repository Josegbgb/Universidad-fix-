import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token) return <Navigate to="/" replace />;

  if (!allowedRoles.includes(userRole || "")) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
<script src=""></script>;
