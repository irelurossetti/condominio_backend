import { useEffect, useMemo, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../services/users";
import UserModal from '../components/UserModal';
import UserDetailsModal from '../components/UserDetailsModal';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); // Estado para el filtro de búsqueda
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Estados para la Paginación
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  // Carga los datos desde una URL específica (para paginación)
  async function load(url = "users/") {
    setLoading(true);
    try {
      const data = await listUsers(url);
      setRows(data.results || []);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch (error) {
      console.error("No se pudo cargar la lista de usuarios", error);
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial
  useEffect(() => { load(); }, []);

  // Función para recargar los datos (usada después de añadir/eliminar mascotas, etc.)
  const handleDataChange = async () => {
    // Para recargar, simplemente volvemos a llamar a la función `load`
    await load(); 
  };

  const handleSave = async (userData, userId) => {
    try {
      if (userId) {
        await updateUser(userId, userData);
      } else {
        await createUser(userData);
      }
      setIsEditModalOpen(false);
      await load(); // ¡Importante! Recargamos la lista desde la primera página
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage = "No se pudo guardar el usuario.";
      if (errorData) {
        errorMessage = Object.entries(errorData).map(([key, value]) => `${key}: ${value.join(', ')}`).join('\n');
      }
      alert(errorMessage);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("¿Seguro que quieres eliminar a este usuario?")) {
      try {
        await deleteUser(userId);
        await load(); // Recargamos la lista
      } catch (error) {
        alert(error.response?.data?.detail || "No se pudo eliminar.");
      }
    }
  };

  // Maneja el clic en los botones de paginación
  const handlePageChange = (url) => {
    if (!url) return;
    const path = url.substring(url.indexOf('/api/') + 5);
    load(path);
  }

  const openCreateModal = () => { setSelectedUser(null); setIsEditModalOpen(true); };
  const openEditModal = (user) => { setSelectedUser(user); setIsEditModalOpen(true); };
  const openDetailsModal = (user) => { setSelectedUser(user); setIsDetailsModalOpen(true); };

  // Filtro de búsqueda que funciona sobre los datos de la página actual
  const filteredRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(u =>
      (u.username || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.profile?.full_name || "").toLowerCase().includes(s)
    );
  }, [rows, q]);

  return (
    <div className="users-page">
      <h1 className="page-title">Gestión de Usuarios</h1>
      <p className="page-sub">Administra los residentes del condominio</p>
      <div className="card" style={{ display:"grid", gap:12 }}>
        <div className="toolbar">
            <input 
              className="grow" 
              placeholder="Buscar por nombre, email o usuario..." 
              value={q} 
              onChange={e => setQ(e.target.value)} 
            />
            <button onClick={openCreateModal}>➕ Nuevo Usuario</button>
        </div>

        {loading ? (
          <p>Cargando usuarios...</p>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr><th>Usuario</th><th>Contacto</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {filteredRows.length > 0 ? (
                  filteredRows.map(u => (
                    <tr key={u.id}>
                      <td><div style={{fontWeight:700}}>{u.profile?.full_name || u.username}</div><div style={{color:"var(--muted)"}}>@{u.username}</div></td>
                      <td>{u.email || "-"}</td>
                      <td>{u.profile?.role || "N/A"}</td>
                      <td><span className={"badge " + (u.is_active ? "success" : "gray")}>{u.is_active ? "Activo" : "Inactivo"}</span></td>
                      <td>
                        {/* --- BOTONES CON ESTILO CORREGIDO --- */}
                        <button onClick={() => openDetailsModal(u)} style={{background: '#0d6efd'}}>Ver</button>
                        <button onClick={() => openEditModal(u)} style={{marginLeft: '6px'}}>Editar</button>
                        <button onClick={() => handleDelete(u.id)} style={{background: '#dc2626', marginLeft: '6px'}}>Eliminar</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5">No se encontraron usuarios.</td></tr>
                )}
              </tbody>
            </table>
            <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px'}}>
                <button onClick={() => handlePageChange(prevPage)} disabled={!prevPage}>Anterior</button>
                <button onClick={() => handlePageChange(nextPage)} disabled={!nextPage}>Siguiente</button>
            </div>
          </>
        )}
      </div>
      <UserModal isOpen={isEditModalOpen} onRequestClose={() => setIsEditModalOpen(false)} user={selectedUser} onSave={handleSave} onDataChange={handleDataChange} />
      <UserDetailsModal isOpen={isDetailsModalOpen} onRequestClose={() => setIsDetailsModalOpen(false)} user={selectedUser} />
    </div>
  );
}