// src/services/notifications.js
import api from "../api";

// Obtiene la lista de notificaciones del usuario
export async function listNotifications() {
  const { data } = await api.get("notifications/");
  return data;
}

// Marca todas las notificaciones como leídas
export async function markAllNotificationsAsRead() {
  await api.post("notifications/mark_all_as_read/");
}