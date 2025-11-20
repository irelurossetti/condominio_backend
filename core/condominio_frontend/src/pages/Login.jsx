// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import { login } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo iniciar sesión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="lmw-screen">
      <div className="lmw-container">
        <div className="lmw-logo-img">
          <img
           src="/brand/logo-smart.png"
           alt="Smart Condominium"
           width={88}
           height={88}
           />
        </div>
        
        <h1 className="lmw-title">Bienvenido</h1>
        <p className="lmw-subtitle">Inicie sesión para acceder a su cuenta</p>

        <form className="lmw-form" onSubmit={onSubmit}>
          <label className="lmw-input">
            <span className="lmw-icon">📧</span>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="lmw-input">
            <span className="lmw-icon">🔒</span>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="lmw-submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          {!!error && (
            <div
              style={{
                marginTop: 10,
                color: "#b91c1c",
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
        </form>

        <a className="lmw-link" href="#">
          ¿Olvidó su contraseña?
        </a>
      </div>
    </div>
  );
}
