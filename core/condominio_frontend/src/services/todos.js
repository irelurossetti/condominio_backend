// frontend-js/src/services/todos.js
import api from "../api";

export async function listTodos() {
  const { data } = await api.get("/todos/");
  return data; // podría venir {count, results} (paginado) o lista directa
}

export async function createTodo(payload) {
  const { data } = await api.post("/todos/", payload);
  return data;
}

export async function updateTodo(id, payload) {
  const { data } = await api.patch(`/todos/${id}/`, payload);
  return data;
}

export async function deleteTodo(id) {
  await api.delete(`/todos/${id}/`);
}
