// src/services/reservations.js
import api from "../api";

// Áreas comunes
export async function listCommonAreas() {
  const { data } = await api.get("/common-areas/");
  return data.results ?? data;
}

export async function listReservations() {
  const { data } = await api.get("/reservations/");
  return data.results ?? data;
}

export async function createReservation({ common_area, start, end }) {
  const { data } = await api.post("/reservations/", { common_area, start, end });
  return data;
}

export async function updateReservation(id, payload) {
  const { data } = await api.patch(`/reservations/${id}/`, payload);
  return data;
}

export async function deleteReservation(id) {
  await api.delete(`/reservations/${id}/`);
}

// Convierte "YYYY-MM-DDTHH:mm" del <input type="datetime-local">
// a "YYYY-MM-DDTHH:mm:ss±HH:MM" con el offset local.
function toOffsetISO(value) {
  if (!value) return null;
  const dt = new Date(value.replace(' ', 'T')); // admite " " o "T"
  const tz = -dt.getTimezoneOffset();           // minutos respecto a UTC
  const sign = tz >= 0 ? '+' : '-';
  const pad  = n => String(Math.trunc(Math.abs(n))).padStart(2, '0');

  const yyyy = dt.getFullYear();
  const MM   = pad(dt.getMonth() + 1);
  const dd   = pad(dt.getDate());
  const hh   = pad(dt.getHours());
  const mm   = pad(dt.getMinutes());
  const ss   = '00';
  const oh   = pad(tz / 60);
  const om   = pad(tz % 60);

  return `${yyyy}-${MM}-${dd}T${hh}:${mm}:${ss}${sign}${oh}:${om}`;
}
