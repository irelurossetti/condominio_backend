// src/pages/Reservations.jsx
import { useEffect, useState } from "react";
import {
  listCommonAreas,
  listReservations,
  createReservation,
  updateReservation,
  deleteReservation,
} from "../services/reservations";

// Convierte una fecha cualquiera a 'YYYY-MM-DDTHH:mm' (para <input type="datetime-local">)
function toDateTimeLocal(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

// Convierte 'YYYY-MM-DDTHH:mm' local a ISO-8601 con offset (lo que espera DRF)
function toIsoWithOffset(input) {
  const d = new Date(input);
  const off = -d.getTimezoneOffset(); // minutos respecto UTC
  const sign = off >= 0 ? "+" : "-";
  const pad = (n) => String(Math.trunc(Math.abs(n))).padStart(2, "0");
  const hOff = pad(off / 60);
  const mOff = pad(off % 60);

  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MM = pad(d.getMinutes());
  const SS = pad(d.getSeconds());

  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}${sign}${hOff}:${mOff}`;
}

export default function Reservations() {
  // --- estado del formulario ---
  const [areas, setAreas] = useState([]);
  const [areaId, setAreaId] = useState(""); // string en el select
  const [start, setStart] = useState("");   // 'YYYY-MM-DDTHH:mm'
  const [end, setEnd] = useState("");       // 'YYYY-MM-DDTHH:mm'
  const [editingId, setEditingId] = useState(null);

  // --- estado de UI / lista ---
  const [reservations, setReservations] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Carga inicial
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    setMsg("");
    try {
      const [areasData, reservationsData] = await Promise.all([
        listCommonAreas(),
        listReservations(),
      ]);
      // Algunos endpoints vienen paginados (results) y otros no
      const a = areasData?.results ?? areasData ?? [];
      const r = reservationsData?.results ?? reservationsData ?? [];
      setAreas(a);
      setReservations(r);

      // Si no hay valor seleccionado aún, selecciona la primera área
      if (!areaId && a.length) setAreaId(String(a[0].id));
    } catch (err) {
      console.error(err);
      setMsg("Error al cargar datos.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setMsg("");
    setStart("");
    setEnd("");
    // conserva el área seleccionada por comodidad
  }

  // Editar: sube los datos al formulario
  function handleEdit(res) {
    setEditingId(res.id);
    // Normalizamos nombres de campos (depende del serializer)
    const startServer =
      res.start ?? res.start_datetime ?? res.start_time ?? res.from;
    const endServer =
      res.end ?? res.end_datetime ?? res.end_time ?? res.to;

    // El id del área puede llegar como 'common_area', 'area', etc.
    const areaServer =
      res.common_area ?? res.area ?? res.area_id ?? res.common_area_id;

    if (areaServer) setAreaId(String(areaServer));
    setStart(toDateTimeLocal(startServer));
    setEnd(toDateTimeLocal(endServer));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Borrar
  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta reserva?")) return;
    try {
      await deleteReservation(id);
      setMsg("Reserva eliminada.");
      await loadData();
    } catch (err) {
      console.error(err);
      setMsg(
        err?.response?.data?.detail ??
          "No se pudo eliminar la reserva."
      );
    }
  }

  // Crear / Actualizar
  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (!areaId || !start || !end) {
      setMsg("Completa todos los campos.");
      return;
    }

    const payload = {
      common_area: Number(areaId), // <-- ID numérico
      start: toIsoWithOffset(start),
      end: toIsoWithOffset(end),
    };

    try {
      if (editingId) {
        await updateReservation(editingId, payload);
        setMsg("Reserva actualizada con éxito.");
      } else {
        await createReservation(payload);
        setMsg("Reserva creada con éxito.");
      }
      resetForm();
      await loadData();
    } catch (err) {
      console.error(err);
      // Muestra mensajes del backend si existen
      const apiMsg =
        err?.response?.data?.detail ??
        (typeof err?.response?.data === "string"
          ? err.response.data
          : JSON.stringify(err?.response?.data ?? {}));
      setMsg(apiMsg || "No se pudo guardar la reserva. Revisa los horarios.");
    }
  }

  // Render
  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Reservas de Áreas Comunes</h1>

      <section className="card" style={{ maxWidth: 720 }}>
        <h3>{editingId ? "Editar Reserva" : "Crear Nueva Reserva"}</h3>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <select
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
          >
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.title ?? `Área #${a.id}`}
              </option>
            ))}
            {!areas.length && <option value="">(sin áreas)</option>}
          </select>

          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading}>
              {editingId ? "Actualizar" : "Reservar"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{ background: "grey" }}
              >
                Cancelar edición
              </button>
            )}
          </div>

          {msg && (
            <p
              style={{
                marginTop: 6,
                color: /error|no|bad|fail|no se pudo/i.test(msg) ? "#c00" : "#0a7",
                fontWeight: 600,
              }}
            >
              {msg}
            </p>
          )}
        </form>
      </section>

      <section>
        <h3>Mis Próximas Reservas</h3>
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4" }}>
              <th>Área</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Hecha el</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((r) => {
              const areaName =
                r.area_name ?? r.common_area_name ?? r.area ?? `#${r.common_area ?? r.area_id}`;
              const startServer =
                r.start ?? r.start_datetime ?? r.start_time ?? r.from;
              const endServer =
                r.end ?? r.end_datetime ?? r.end_time ?? r.to;
              const created =
                r.created_at ?? r.created ?? r.createdOn ?? r.created_on;

              return (
                <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>{areaName}</td>
                  <td>{startServer ? new Date(startServer).toLocaleString() : "-"}</td>
                  <td>{endServer ? new Date(endServer).toLocaleString() : "-"}</td>
                  <td>{created ? new Date(created).toLocaleDateString() : "-"}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(r)}
                      style={{ fontSize: 12, padding: "6px 8px" }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      style={{
                        fontSize: 12,
                        padding: "6px 8px",
                        background: "#dc2626",
                        marginLeft: 6,
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
            {!reservations.length && (
              <tr>
                <td colSpan="5">No tienes reservas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
