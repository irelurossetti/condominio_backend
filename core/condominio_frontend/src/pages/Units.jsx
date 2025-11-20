// src/pages/Units.jsx
import { useEffect, useState } from "react";
import { listUnits, createUnit, updateUnit, deleteUnit } from "../services/units";
import { listUsers } from "../services/users";

const empty = { id: null, code: "", tower: "", number: "", owner: "" };

export default function Units() {
  const [rows, setRows] = useState([]);
  const [owners, setOwners] = useState([]);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const [uData, usersData] = await Promise.all([listUnits(), listUsers()]);
      setRows(uData.results || uData);
      const list = (usersData.results || usersData).map(u => ({
        id: u.id, label: `${u.username} (${u.email})`,
      }));
      setOwners(list);
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar la información.");
    }
  }
  useEffect(() => { load(); }, []);

  function onEdit(item) {
    setForm({ id: item.id, code: item.code, tower: item.tower, number: item.number, owner: item.owner });
  }
  function onNew() { setForm(empty); }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      if (form.id) await updateUnit(form.id, form);
      else await createUnit(form);
      await load();
      setForm(empty);
      setMsg("Guardado.");
    } catch (e) {
      console.error(e);
      setMsg("Error al guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("¿Eliminar unidad?")) return;
    try {
      await deleteUnit(id);
      await load();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo eliminar.");
    }
  }

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      <h1>Unidades</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <input placeholder="Código (ej. T1-302)" value={form.code} onChange={e=>setForm({...form, code:e.target.value})}/>
        <input placeholder="Torre" value={form.tower} onChange={e=>setForm({...form, tower:e.target.value})}/>
        <input placeholder="Número" value={form.number} onChange={e=>setForm({...form, number:e.target.value})}/>
        <select value={form.owner} onChange={e=>setForm({...form, owner:e.target.value})}>
          <option value="">-- Propietario --</option>
          {owners.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <div style={{ gridColumn: "1 / span 4" }}>
          <button disabled={saving}>{form.id ? "Actualizar" : "Crear"}</button>
          <button type="button" onClick={onNew} style={{ marginLeft: 8 }}>Nuevo</button>
          {msg && <span style={{ marginLeft: 12, color: "#0a7", fontWeight: 600 }}>{msg}</span>}
        </div>
      </form>

      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f4f4f4" }}>
            <th>ID</th><th>Código</th><th>Torre</th><th>Número</th><th>Propietario</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{r.id}</td>
              <td>{r.code}</td>
              <td>{r.tower}</td>
              <td>{r.number}</td>
              <td>{r.owner_username}</td>
              <td>
                <button onClick={() => onEdit(r)}>Editar</button>
                <button onClick={() => onDelete(r.id)} style={{ marginLeft: 6 }}>Eliminar</button>
              </td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan="6">Sin unidades.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
