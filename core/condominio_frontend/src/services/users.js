// src/services/users.js
import api from "../api";

// Esta es la función corregida. Acepta una URL como texto.
export async function listUsers(url = "users/") {
  const { data } = await api.get(url);
  return data;
}

// El resto de las funciones ya están bien
export async function createUser(payload) {
  const { data } = await api.post("users/", payload);
  return data;
}

export async function updateUser(id, payload) {
  const { data } = await api.patch(`users/${id}/`, payload);
  return data;
}

export async function deleteUser(id) {
  await api.delete(`users/${id}/`);
}
export async function listStaffUsers() {
  const { data } = await api.get("users/staff_members/");
  return data;
}