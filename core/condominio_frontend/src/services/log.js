// src/services/log.js
import api from "../api";

// 👈 Modifica la función para aceptar 'params'
export const getActivityLog = (params = {}) => 
  api.get("activity-logs/", { params }).then((r) => r.data);

export const createCustomLog = (payload) =>
  api.post("activity-logs/create_custom/", payload).then((r) => r.data);

export const logPageAccess = (page_name) =>
  api.post("log/page-access/", { page_name });