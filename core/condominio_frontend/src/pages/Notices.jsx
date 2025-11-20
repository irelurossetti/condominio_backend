import { useEffect, useState } from "react";
// 👇 Importa el nuevo servicio
import { listNotices, createNotice, updateNotice, deleteNotice, listNoticeCategories } from "../services/notices";
import { fetchMe } from "../services/me";
import { toast } from "react-hot-toast";

const toDateTimeLocal = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function Notices() {
  const [rows, setRows] = useState([]);
  // 👇 Añade 'category' al formulario y un nuevo estado para las categorías
  const [form, setForm] = useState({ id: null, title: "", body: "", publish_date: "", category: "" });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  async function load() {
    try {
      const [noticesData, meData, categoriesData] = await Promise.all([
        listNotices(), 
        fetchMe(),
        listNoticeCategories() // Carga las categorías
      ]);
      setRows(noticesData.results || noticesData);
      setIsAdmin(meData?.profile?.role === 'ADMIN');
      setCategories(categoriesData.results || categoriesData); // Guarda las categorías
    } catch (error) {
      toast.error("No se pudieron cargar los datos.");
    } finally {
      setIsLoading(false);
    }
  }
  
  useEffect(() => {
    load();
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const payload = { ...form };
    if (!payload.publish_date) delete payload.publish_date;
    if (!payload.category) delete payload.category; // No enviar si no se seleccionó

    try {
      if (form.id) {
        await updateNotice(form.id, payload);
        toast.success("Aviso actualizado.");
      } else {
        await createNotice(payload);
        toast.success("Aviso publicado.");
      }
      setForm({ id: null, title: "", body: "", publish_date: "", category: "" });
      await load();
    } catch (e) {
      toast.error("No tienes permiso para realizar esta acción.");
    }
  }

  function handleEdit(notice) {
    setForm({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      publish_date: toDateTimeLocal(notice.publish_date),
      category: notice.category || "" // Carga la categoría del aviso
    });
    window.scrollTo(0, 0);
  }
  
  function cancelEdit() {
    setForm({ id: null, title: "", body: "", publish_date: "", category: "" });
  }

  async function handleDelete(noticeId) {
    if (window.confirm("¿Seguro que quieres eliminar este aviso?")) {
      try {
        await deleteNotice(noticeId);
        toast.success("Aviso eliminado.");
        await load();
      } catch (error) {
        toast.error("No se pudo eliminar el aviso.");
      }
    }
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 24 }}>
      <h1>{isAdmin && form.id ? "Editando Aviso" : "Avisos"}</h1>

      {isAdmin && (
        <form onSubmit={onSubmit} className="card" style={{ display: "grid", gap: 12 }}>
          <input placeholder="Título" required value={form.title} onChange={e=>setForm({...form, title:e.target.value})}/>
          <textarea placeholder="Contenido" rows={4} required value={form.body} onChange={e=>setForm({...form, body:e.target.value})}/>
          
          {/* 👇 Div para poner la fecha y la categoría en la misma línea */}
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
            <label>
              Categoría
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                <option value="">-- Sin categoría --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha de Publicación (opcional)
              <input 
                type="datetime-local" 
                value={form.publish_date} 
                onChange={e => setForm({...form, publish_date: e.target.value})}
              />
            </label>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit">{form.id ? "Guardar Cambios" : "Publicar Aviso"}</button>
            {form.id && <button type="button" onClick={cancelEdit} style={{ background: "var(--silver-500)"}}>Cancelar</button>}
          </div>
        </form>
      )}

      {isLoading ? <p>Cargando avisos...</p> : (
        <div style={{ display: "grid", gap: 16 }}>
          {rows.map(n => (
            <article key={n.id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: '16px' }}>
                <div>
                  <h3 style={{ margin: "0 0 6px" }}>
                    {/* 👇 Muestra la etiqueta de la categoría */}
                    {n.category_name && (
                      <span className="badge" style={{backgroundColor: n.category_color, color: 'white', marginRight: '8px'}}>
                        {n.category_name}
                      </span>
                    )}
                    {n.title}
                  </h3>
                  <small>por {n.created_by_username} — {new Date(n.publish_date).toLocaleString()}</small>
                </div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => handleEdit(n)} style={{ padding: '6px 10px', fontSize: '14px' }}>Editar</button>
                    <button onClick={() => handleDelete(n.id)} style={{ padding: '6px 10px', fontSize: '14px', background: '#dc2626' }}>Eliminar</button>
                  </div>
                )}
              </div>
              <div dangerouslySetInnerHTML={{ __html: n.body }} style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }} />
            </article>
          ))}
          {!rows.length && <p>No hay avisos publicados.</p>}
        </div>
      )}
    </div>
  );
}