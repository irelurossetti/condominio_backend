import api from "../api";

export async function listNotices(params = {}) {
  const { data } = await api.get("notices/", { params });
  return data;
}
export async function createNotice(payload) {
  const { data } = await api.post("notices/", payload);
  return data;
}
// Función para actualizar (editar) un aviso existente
export async function updateNotice(id, payload) {
  const { data } = await api.patch(`notices/${id}/`, payload);
  return data;
}

// Función para eliminar un aviso
export async function deleteNotice(id) {
  await api.delete(`notices/${id}/`);
}

export async function listNoticeCategories() {
  const { data } = await api.get("notice-categories/");
  return data;
}