// src/api.js
import axios from "axios";

const STORAGE_KEY = "token";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  headers: { "Content-Type": "application/json" },
  // withCredentials: false
});

// Añade Authorization si hay token
api.interceptors.request.use((cfg) => {
  const token =
    localStorage.getItem(STORAGE_KEY) || localStorage.getItem("access");
  if (token) {
    // Cambia a `Token ${token}` si tu backend usa DRF TokenAuth
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
});

// Si responde 401, limpiar sesión y mandar a /login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("access");
      if (!location.pathname.startsWith("/login")) location.assign("/login");
    }
    return Promise.reject(err);
  }
);

// 👉 Exporto en las dos formas para no romper imports viejos
export { api };        // named export
export default api;    // default export
