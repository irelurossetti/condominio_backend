// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Protected from "./components/Protected.jsx";
import AdminRoute from "./components/AdminRoute.jsx";
import Layout from "./components/Layout.jsx";
import ActivityLog from "./pages/ActivityLog.jsx"; // Importa
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyAccount from "./pages/MyAccount.jsx";
import Notices from "./pages/Notices.jsx";
import Fees from "./pages/Fees.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Users from "./pages/Users.jsx";
import Units from "./pages/Units.jsx";
import Reports from "./pages/Reports.jsx";
import { Toaster } from 'react-hot-toast';
import Reservations from "./pages/Reservations.jsx"; // <-- Importa

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" /> {/* <-- Añade esto */}
      <Routes>
        {/* pública */}
        <Route path="/login" element={<Login />} />

        {/* protegidas (requiere sesión) */}
        <Route element={<Protected />}>
          {/* layout con el menú */}
          <Route path="/activity-log" element={<ActivityLog />} />
          <Route element={<Layout />}>
            <Route element={<Layout />}></Route>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-account" element={<MyAccount />} />
            <Route path="/notices" element={<Notices />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/maintenance" element={<Maintenance />} />
            {/* solo admin */}
            <Route element={<AdminRoute />}>
              <Route path="/users" element={<Users />} />
              <Route path="/units" element={<Units />} />
              <Route path="/reports" element={<Reports />} />
              </Route>
              <Route path="/reservations" element={<Reservations />} />
            </Route>
          </Route>

        {/* comodín */}
        <Route path="*" element={<h1 style={{ padding: 24 }}>404</h1>} />
      </Routes>
    </BrowserRouter>
  );
}
