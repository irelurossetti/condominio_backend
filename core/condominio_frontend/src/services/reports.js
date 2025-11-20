// src/services/reports.js
import api from "../api";

export async function financeReport(params = {}) {
  const search = new URLSearchParams();
  if (params.from)  search.set("from", params.from);
  if (params.to)    search.set("to", params.to);
  if (params.owner) search.set("owner", params.owner);
  const { data } = await api.get(`reports/finance/?${search.toString()}`);
  return data;
}

// --- 👇 FUNCIÓN CORREGIDA ---
// Se ha quitado la barra inicial de "/reports/..."
export async function getDashboardStats() {
  const { data } = await api.get("reports/dashboard-stats/");
  return data;
}