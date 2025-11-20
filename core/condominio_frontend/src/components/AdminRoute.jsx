import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchMe } from "../services/me";

export default function AdminRoute() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe()
      .then(m => { setMe(m); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;

  const isAdmin = me?.profile?.role === "ADMIN";
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
}
