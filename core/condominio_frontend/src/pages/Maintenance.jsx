import { useEffect, useState, useRef } from "react"; // 👈 CORRECCIÓN AQUÍ
import {
  listMaintenanceRequests,
  createMaintenanceRequest,
  updateMaintenanceRequestStatus,
  listMaintenanceRequestComments,
  createMaintenanceRequestComment,
  updateMaintenanceRequest,
  uploadMaintenanceAttachment,
} from "../services/maintenance";
import { fetchMe } from "../services/me";
import { listStaffUsers } from "../services/users";
import { toast } from "react-hot-toast";

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: { backgroundColor: '#fef3c7', color: '#92400e' },
    IN_PROGRESS: { backgroundColor: '#dbeafe', color: '#1e40af' },
    COMPLETED: { backgroundColor: '#dcfce7', color: '#166534' },
  };
  return <span className="badge" style={styles[status] || {}}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    BAJA: { backgroundColor: '#dbeafe', color: '#1e40af' },
    MEDIA: { backgroundColor: '#fef3c7', color: '#92400e' },
    ALTA: { backgroundColor: '#fee2e2', color: '#991b1b' },
    URGENTE: { backgroundColor: '#991b1b', color: 'white' },
  };
  return <span className="badge" style={styles[priority] || {}}>{priority}</span>;
};

export default function Maintenance() {
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", priority: "MEDIA" });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentForm, setCommentForm] = useState({ body: "" });
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  const isAdmin = me?.profile?.role === "ADMIN";

  async function loadData() {
    try {
      const fetchPromises = [listMaintenanceRequests()];
      if (isAdmin) {
        fetchPromises.push(listStaffUsers());
      }
      const [requestsData, staffData] = await Promise.all(fetchPromises);
      setRequests(requestsData.results || requestsData);
      if (staffData) {
        setStaff(staffData);
      }
    } catch (err) {
      toast.error("Error al cargar los datos.");
    }
  }

  async function loadComments(requestId) {
    setIsCommentsLoading(true);
    try {
      const commentsData = await listMaintenanceRequestComments(requestId);
      setComments(commentsData.results || commentsData);
    } catch (err) {
      console.error("Error cargando comentarios:", err);
    } finally {
      setIsCommentsLoading(false);
    }
  }

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  useEffect(() => {
    if (me) {
      loadData();
    }
  }, [me]);

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    loadComments(request.id);
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
    setComments([]);
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };
  
  async function onSubmit(e) {
    e.preventDefault();
    let newRequest;
    try {
      newRequest = await createMaintenanceRequest(form);
      toast.success("Solicitud enviada, subiendo adjuntos...");

      if (files.length > 0) {
        const uploadPromises = files.map(file => uploadMaintenanceAttachment(newRequest.id, file));
        await Promise.all(uploadPromises);
        toast.success("Archivos subidos con éxito.");
      }

      setForm({ title: "", description: "", priority: "MEDIA" });
      setFiles([]);
      await loadData();
    } catch (err) {
      toast.error("No se pudo enviar la solicitud completa.");
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateMaintenanceRequestStatus(id, newStatus);
      toast.success("Estado actualizado.");
      await loadData();
    } catch (error) {
      toast.error("No se pudo actualizar el estado.");
    }
  };

  const handleAssignWorker = async (requestId, workerId) => {
    try {
      await updateMaintenanceRequest(requestId, { assigned_to: workerId || null });
      toast.success("Trabajador asignado.");
      await loadData();
    } catch (error) {
      toast.error("No se pudo asignar el trabajador.");
    }
  };

  const handlePriorityChange = async (requestId, newPriority) => {
    try {
      await updateMaintenanceRequest(requestId, { priority: newPriority });
      toast.success("Prioridad actualizada.");
      await loadData();
    } catch (error) {
      toast.error("No se pudo actualizar la prioridad.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentForm.body || !selectedRequest) return;
    try {
      await createMaintenanceRequestComment({
        request: selectedRequest.id,
        body: commentForm.body,
      });
      setCommentForm({ body: "" });
      await loadComments(selectedRequest.id);
    } catch (error) {
      toast.error("No se pudo agregar el comentario.");
    }
  };

  if (!me) {
    return <div style={{ padding: 24 }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>Mantenimiento y Soporte</h1>

      {!isAdmin && (
        <section className="card">
          <h3>Reportar un Incidente</h3>
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 600 }}>
            <input placeholder="Título..." value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Descripción..." rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            <label>
              Prioridad
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </label>
            <div>
              <label>Adjuntar Fotos (opcional)</label>
              <input type="file" multiple accept="image/*" onChange={handleFileChange} ref={fileInputRef} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current.click()} style={{marginTop: '4px', background: 'var(--silver-500)'}}>
                Seleccionar Archivos
              </button>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                {files.map((file, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img src={URL.createObjectURL(file)} alt="vista previa" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}/>
                    <button type="button" onClick={() => handleRemoveFile(index)} className="remove-file-button">X</button>
                  </div>
                ))}
              </div>
            </div>
            <button type="submit">Enviar Reporte</button>
          </form>
        </section>
      )}

      <section>
        <h3>{isAdmin ? "Todas las Solicitudes" : "Mis Solicitudes"}</h3>
        <table className="table">
            <thead>
            <tr>
              <th>Título / Asignado a</th>
              {isAdmin && <th>Reportado por</th>}
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>
                  <div style={{ fontWeight: 'bold' }}>{req.title}</div>
                  <div style={{ fontSize: '12px', color: 'gray' }}>
                    Asignado a: {req.assigned_to_username || 'Nadie'}
                  </div>
                </td>
                {isAdmin && <td>{req.reported_by_username}</td>}
                <td><PriorityBadge priority={req.priority_display} /></td>
                <td><StatusBadge status={req.status} /></td>
                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => handleOpenDetails(req)}>Ver detalles</button>
                    {isAdmin && (
                      <>
                        <select value={req.priority} onChange={(e) => handlePriorityChange(req.id, e.target.value)}>
                          <option value="BAJA">Baja</option>
                          <option value="MEDIA">Media</option>
                          <option value="ALTA">Alta</option>
                          <option value="URGENTE">Urgente</option>
                        </select>
                        <select value={req.status} onChange={(e) => handleStatusChange(req.id, e.target.value)}>
                          <option value="PENDING">Pendiente</option>
                          <option value="IN_PROGRESS">En Progreso</option>
                          <option value="COMPLETED">Completado</option>
                        </select>
                        <select value={req.assigned_to || ''} onChange={(e) => handleAssignWorker(req.id, e.target.value)}>
                          <option value="">-- Asignar a --</option>
                          {staff.map(s => (<option key={s.id} value={s.id}>{s.username}</option>))}
                        </select>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!requests.length && (<tr><td colSpan={isAdmin ? 6 : 4}>No hay solicitudes.</td></tr>)}
          </tbody>
        </table>
      </section>

      {selectedRequest && (
        <div className="card" style={{ maxWidth: 600, justifySelf: "center", marginTop: '16px' }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3>Detalles de: {selectedRequest.title}</h3>
            <button onClick={handleCloseDetails}>Cerrar</button>
          </div>
          <p><b>Descripción:</b> {selectedRequest.description}</p>
          <p><b>Reportado por:</b> {selectedRequest.reported_by_username}</p>
          <p><b>Asignado a:</b> {selectedRequest.assigned_to_username || 'Nadie'}</p>
          <p><b>Prioridad:</b> <PriorityBadge priority={selectedRequest.priority_display} /></p>
          <p><b>Estado:</b> <StatusBadge status={selectedRequest.status} /></p>
          {selectedRequest.status === 'COMPLETED' && (
             <p><b>Completado por:</b> {selectedRequest.completed_by_username} el {new Date(selectedRequest.completed_at).toLocaleDateString()}</p>
           )}
          <hr style={{ margin: "16px 0" }} />
          <h4>Archivos Adjuntos</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedRequest.attachments?.length > 0 ? (
              selectedRequest.attachments.map(att => (
                <a href={att.file} target="_blank" rel="noopener noreferrer" key={att.id}>
                  <img src={att.file} alt="adjunto" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}/>
                </a>
              ))
            ) : (<p className="muted">No hay archivos adjuntos.</p>)}
          </div>
          <h4 style={{marginTop: '16px'}}>Comentarios</h4>
          <div style={{ maxHeight: 200, overflowY: "auto", display: "grid", gap: 12 }}>
            {isCommentsLoading ? <p>Cargando comentarios...</p> : (
              comments.length > 0 ? comments.map((c) => (
                <div key={c.id} style={{ padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                    <span>{c.user_username}</span>
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: "4px 0 0" }}>{c.body}</p>
                </div>
              )) : <p>No hay comentarios aún.</p>
            )}
          </div>
          <form onSubmit={handleCommentSubmit} style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <textarea
              placeholder="Añadir un comentario..."
              rows={2}
              value={commentForm.body}
              onChange={(e) => setCommentForm({ body: e.target.value })}
              style={{ flex: 1 }}
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
}