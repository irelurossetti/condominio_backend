// src/services/entities.js
import api from "../api";

// --- Vehículos ---
export const createVehicle = (payload) => api.post("vehicles/", payload).then(r => r.data);
export const deleteVehicle = (id) => api.delete(`vehicles/${id}/`);

// --- Mascotas ---
export const createPet = (payload) => api.post("pets/", payload).then(r => r.data);
export const deletePet = (id) => api.delete(`pets/${id}/`);

// --- Familiares ---
export const createFamilyMember = (payload) => api.post("family-members/", payload).then(r => r.data);
export const deleteFamilyMember = (id) => api.delete(`family-members/${id}/`);