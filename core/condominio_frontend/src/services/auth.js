// src/services/auth.js
import api from "../api";

const STORAGE_KEY = "token";

export async function login(email, password) {
  const { data } = await api.post("/auth/login/", { email, password });

  // intenta varios nombres comunes devueltos por el backend
  const token = data.access || data.token || data.key;
  if (!token) throw new Error("El servidor no devolvió un token");

  // guarda siempre con la misma clave
  localStorage.setItem(STORAGE_KEY, token);

  // opcional: compat con código viejo que lee "access"
  localStorage.setItem("access", token);

  return data;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("access"); // limpia también el alias si existe
}

export function isAuthed() {
  return !!localStorage.getItem(STORAGE_KEY);
}

// alias por compatibilidad
export const isAuthenticated = isAuthed;

export function clearSession() {
  logout();
}
