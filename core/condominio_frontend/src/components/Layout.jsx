// src/components/Layout.jsx

// 👇 PASO 1: Importa useState, useEffect y useRef
import { useEffect, useState, useRef } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { fetchMe } from "../services/me";
import { logPageAccess } from "../services/log";
import LogoutButton from "./LogoutButton";
import NotificationBell from './NotificationBell'; // 👈 Importa el nuevo componente

const pageMap = {
  "/dashboard": "Dashboard",
  "/my-account": "Mi Cuenta",
  "/notices": "Avisos",
  "/fees": "Cuotas",
  "/reservations": "Reservas",
  "/maintenance": "Mantenimiento",
  "/users": "Usuarios",
  "/units": "Unidades",
  "/reports": "Reportes",
  "/activity-log": "Bitácora de Actividad",
};

export default function Layout() {
  const [me, setMe] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 👇 PASO 2: Añade un estado para controlar la visibilidad del menú
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null); // Para detectar clics fuera del menú

  useEffect(() => {
    fetchMe().then(setMe).catch(() => navigate("/login", { replace: true }));
  }, [navigate]);

  useEffect(() => {
    const pageName = pageMap[location.pathname] || location.pathname;
    logPageAccess(pageName)
      .catch(err => console.error("Error al registrar acceso a página:", err));
  }, [location.pathname]);

  // 👇 PASO 3: Hook para cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);


  const isAdmin = me?.profile?.role === "ADMIN";
  const s = ({ isActive }) => "s-navlink" + (isActive ? " active" : "");

  return (
    <div className="app-shell has-sidebar">
      <aside className="sidebar">
        <a className="brand" href="/dashboard" title="Ir al inicio">
          <img src="/brand/logo-smart.png" alt="Smart" className="brand-mark" />
          <div className="brand-text">
            <strong>Smart</strong><span>Condominium</span>
          </div>
        </a>

        <nav className="side-nav">
          <NavLink to="/dashboard" className={s}>🏠 Inicio</NavLink>
          {/* 👇 PASO 4: ELIMINA el NavLink de "Mi cuenta" de aquí */}
          {/* <NavLink to="/my-account" className={s}>👤 Mi cuenta</NavLink> */}
          <NavLink to="/notices" className={s}>🔔 Avisos</NavLink>
          <NavLink to="/fees" className={s}>💳 Cuotas</NavLink>
          <NavLink to="/reservations" className={s}>📅 Reservas</NavLink>
          <NavLink to="/maintenance" className={s}>🛠️ Mantenimiento</NavLink>
          
          {isAdmin && (
            <>
              <NavLink to="/users" className={s}>👥 Usuarios</NavLink>
              <NavLink to="/units" className={s}>🏢 Unidades</NavLink>
              <NavLink to="/reports" className={s}>📄 Reportes</NavLink>
              <NavLink to="/activity-log" className={s}>📋 Bitácora</NavLink>
            </>
          )}
        </nav>

        {/* 👇 PASO 5: Modifica el pie de la barra lateral para que sea el menú */}
        <div className="sidebar-footer" ref={menuRef}>
          {/* Este es el menú que aparecerá cuando hagas clic */}
          {isMenuOpen && (
            <div className="profile-menu">
              <NavLink to="/my-account" className="profile-menu-item" onClick={() => setIsMenuOpen(false)}>
                👤 Mi Cuenta
              </NavLink>
              <div className="profile-menu-separator" />
              {/* Mueve el botón de Logout aquí dentro */}
              <LogoutButton>Cerrar sesión</LogoutButton>
            </div>
          )}

          {/* Convierte la información del usuario en un botón para abrir/cerrar el menú */}
          <button className="profile-trigger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <div className="avatar">{(me?.username || "?")[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700 }}>{me?.username || "—"}</div>
              <div className="role">{me?.profile?.role || "—"}</div>
            </div>
            <span className="profile-trigger-arrow">{isMenuOpen ? '▲' : '▼'}</span>
          </button>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="app-title">🌿 Gestión Ecológica e Inteligente</div>
          {/* 👇 Reemplaza el <div> con el componente de la campana */}
          <NotificationBell />
        </header>

        <div className="app-main">
          <div className="container">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}