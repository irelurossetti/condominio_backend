import api from "../api";

export async function listExpenseTypes(params = {}) {
  const { data } = await api.get("expense-types/", { params });
  return data;
}
export async function createExpenseType(payload) {
  const { data } = await api.post("expense-types/", payload);
  return data;
}
export async function updateExpenseType(id, payload) {
  const { data } = await api.patch(`expense-types/${id}/`, payload);
  return data;
}
export async function deleteExpenseType(id) {
  await api.delete(`expense-types/${id}/`);
}
