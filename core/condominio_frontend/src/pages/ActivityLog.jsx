import { useEffect, useState } from "react";
import { getActivityLog } from "../services/log";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); // 👈 Nuevo: Estado para el filtro de búsqueda
  const [currentPage, setCurrentPage] = useState(1); // 👈 Nuevo: Estado para la página actual
  const [nextPage, setNextPage] = useState(null); // 👈 Nuevo: URL de la siguiente página
  const [prevPage, setPrevPage] = useState(null); // 👈 Nuevo: URL de la página anterior
  const pageSize = 10; // Tamaño de página fijo

  // 👈 Nuevo: Función para cargar los datos con filtros y paginación
  async function loadData(page = currentPage, search = q) {
    setLoading(true);
    try {
      const params = { page, search, page_size: pageSize };
      const data = await getActivityLog(params);
      setLogs(data.results || data);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }

  // 👈 Carga inicial de datos y cada vez que cambian los filtros
  useEffect(() => {
    loadData(1, q);
  }, [q]);

  // 👈 Manejadores de paginación
  const handleNext = () => {
    if (nextPage) {
      const url = new URL(nextPage);
      const newPage = url.searchParams.get('page');
      setCurrentPage(Number(newPage));
      loadData(newPage);
    }
  };

  const handlePrev = () => {
    if (prevPage) {
      const url = new URL(prevPage);
      const newPage = url.searchParams.get('page');
      setCurrentPage(Number(newPage));
      loadData(newPage);
    }
 //   else {
      // Manejar el caso de la primera página
  //    setCurrentPage(1);
  //    loadData(1);
   // }
  };


  return (
    <div style={{ padding: 24 }}>
      <h1>Bitácora de Actividad del Sistema</h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        {/* 👈 Nuevo: Campo de búsqueda */}
        <input 
          placeholder="Buscar por usuario, acción o detalles..." 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          style={{ width: "100%", maxWidth: 400 }}
        />
        {/* 👈 Nuevo: Botones de paginación */}
        <button onClick={handlePrev} disabled={!prevPage || loading}>
          ← Anterior
        </button>
        <button onClick={handleNext} disabled={!nextPage || loading}>
          Siguiente →
        </button>
      </div>
      
      {loading ? <p>Cargando bitácora...</p> : (
        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.user_username}</td>
                <td>
                  <div style={{ fontWeight: 700 }}>
                    {log.action.replace('_', ' ').toUpperCase()}
                  </div>
                  {log.details && (
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                      {log.details}
                    </div>
                  )}
                </td>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
            {!logs.length && (
              <tr><td colSpan="3">No hay registros en la bitácora.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}