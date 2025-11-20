import { useEffect, useState } from "react";
import { fetchMe, updateMyProfile } from "../services/me";
import { toast } from 'react-hot-toast';

export default function MyAccount() {
  const [me, setMe] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // 👇 PASO 1: Mueve el estado del formulario de contraseña aquí, junto a los otros 'useState'
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMe();
        setMe(data);
      } catch (e) {
        console.error(e);
        toast.error("No se pudo cargar el perfil.");
      }
    })();
  }, []);

  async function onSave(e) {
    e.preventDefault();
    if (!me) return;
    setSaving(true);
    try {
      const prof = await updateMyProfile(me.profile || {});
      setMe((prev) => ({ ...prev, profile: prof }));
      toast.success("Perfil actualizado con éxito");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo actualizar el perfil.");
    } finally {
      setSaving(false);
    }
  }

  // 👇 PASO 2: Mueve la función para cambiar la contraseña aquí, dentro del componente
  async function onPasswordChange(e) {
    e.preventDefault();
    // Aquí irá la lógica para llamar al backend. Por ahora, una alerta.
    // try { await changePassword(passwordForm); ... } catch ...
    alert("Lógica de cambio de contraseña aquí.");
  }

  if (!me) return <div style={{ padding: 24 }}>Cargando…</div>;

  const p = me.profile || { full_name: "", phone: "", role: "RESIDENT" };

  // 👇 PASO 3: Integra el formulario de cambio de contraseña dentro del JSX principal
 return (
  <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}> {/* Aumenta el maxWidth para las columnas */}
    <h1>Mi cuenta</h1>

    {/* Sección de Datos de usuario */}
    <section className="my-account-card"> {/* Usamos una clase para este estilo de tarjeta */}
      <h3>Datos de usuario</h3>
      <p><b>Usuario:</b> {me.username}</p>
      <p><b>Email:</b> {me.email || "-"}</p>
      <p><b>Nombre:</b> {me.first_name} {me.last_name}</p>
    </section>
    
    {/* Sección de Entidades Registradas */}
    <section className="my-account-card" style={{ marginTop: 24 }}> {/* Otro estilo de tarjeta */}
      <h3>Mis Entidades Registradas</h3>
      <h4>Vehículos</h4>
      {me.vehicles?.length > 0 ? (
          me.vehicles.map(v => <p key={v.id}>- <strong>{v.plate}</strong> ({v.brand} {v.model})</p>)
      ) : <p className="muted">No tiene vehículos registrados.</p>}
      
      <h4 style={{marginTop: 16}}>Mascotas</h4>
      {me.pets?.length > 0 ? (
          me.pets.map(p => <p key={p.id}>- <strong>{p.name}</strong> ({p.species})</p>)
      ) : <p className="muted">No tiene mascotas registradas.</p>}

      <h4 style={{marginTop: 16}}>Familiares</h4>
      {me.family_members?.length > 0 ? (
          me.family_members.map(f => <p key={f.id}>- <strong>{f.full_name}</strong> ({f.relationship})</p>)
      ) : <p className="muted">No tiene familiares registrados.</p>}
    </section>

    {/* 👇 NUEVA SECCIÓN PARA AGRUPAR LOS FORMULARIOS EN COLUMNAS */}
    <div className="form-columns"> {/* Esta clase manejará las columnas */}
        {/* Formulario de Perfil */}
        <form onSubmit={onSave} className="my-account-card" style={{ gap: 12 }}> {/* Añade clase de tarjeta y quita margin-top */}
            <h3>Perfil</h3>
            <label>
              Nombre completo<br/>
              <input
                value={p.full_name}
                onChange={(e) => setMe({ ...me, profile: { ...p, full_name: e.target.value } })}
              />
            </label>
            <label>
              Teléfono<br/>
              <input
                value={p.phone}
                onChange={(e) => setMe({ ...me, profile: { ...p, phone: e.target.value } })}
              />
            </label>
            <label>
              Rol<br/>
              <select
                value={p.role}
                disabled 
                onChange={(e) => setMe({ ...me, profile: { ...p, role: e.target.value } })}
              >
                <option value="ADMIN">Administrador</option>
                <option value="RESIDENT">Residente</option>
                <option value="STAFF">Personal</option>
              </select>
            </label>
            <button disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
        </form>

        {/* Formulario de cambio de contraseña */}
        <form onSubmit={onPasswordChange} className="my-account-card" style={{ gap: 12 }}> {/* Añade clase de tarjeta y quita margin-top */}
            <h3>Cambiar Contraseña</h3>
            <input
                type="password"
                placeholder="Contraseña Actual"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                required
            />
            <input
                type="password"
                placeholder="Nueva Contraseña"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                required
            />
            <button type="submit">Actualizar Contraseña</button>
        </form>
    </div> {/* Cierre de form-columns */}
  </div>
);
}