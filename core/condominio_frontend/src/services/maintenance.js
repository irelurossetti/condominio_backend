import api from "../api";

// Obtiene la lista de solicitudes de mantenimiento
export const listMaintenanceRequests = () =>
  api.get("maintenance-requests/").then((r) => r.data);

// Crea una nueva solicitud
export const createMaintenanceRequest = (payload) =>
  api.post("maintenance-requests/", payload).then((r) => r.data);

// Actualiza una solicitud (para prioridad, asignación, etc.)
export const updateMaintenanceRequest = (id, payload) =>
  api.patch(`maintenance-requests/${id}/`, payload).then((r) => r.data);

// Actualiza solo el estado de una solicitud
export const updateMaintenanceRequestStatus = (id, status) =>
  api.patch(`maintenance-requests/${id}/update_status/`, { status });

// Obtiene los comentarios de una solicitud
export const listMaintenanceRequestComments = (requestId) =>
  api.get(`maintenance-request-comments/?request=${requestId}`).then((r) => r.data);

// Crea un nuevo comentario
export const createMaintenanceRequestComment = (payload) =>
  api.post("maintenance-request-comments/", payload).then((r) => r.data);

// Sube un archivo adjunto para una solicitud
export async function uploadMaintenanceAttachment(requestId, file) {
  const formData = new FormData();
  // El backend espera que el ID de la solicitud se llame 'request'
  formData.append('request', requestId); 
  formData.append('file', file);

  // Enviamos los datos como 'multipart/form-data'
  const { data } = await api.post("maintenance-attachments/", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}