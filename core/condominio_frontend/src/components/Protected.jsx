// src/components/Protected.jsx
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../services/auth"; // o { isAuthed } si prefieres ese nombre

export default function Protected({ isAllowed, redirectTo = "/login", children }) {
  const allowed =
    typeof isAllowed === "boolean" ? isAllowed : isAuthenticated();

  if (!allowed) return <Navigate to={redirectTo} replace />;
  return children || <Outlet />;
}
