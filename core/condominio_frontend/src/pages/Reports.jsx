// condominio_frontend/condominio_frontend-7959b787eebec9ec10c59aba1894ad64339d6e5b/src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { financeReport } from "../services/reports";
import { fetchMe } from "../services/me";
import FeesChart from '../components/FeesChart'; // Asegúrate de tener este componente para el gráfico

function money(n){ return `$${(n??0).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`; }

export default function Reports(){
  const [me, setMe] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [owner, setOwner] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  async function load(){
    if (!me) return;
    setLoading(true);
    try{
      const params = {
        from: from || undefined,
        to: to || undefined,
        owner: me.profile?.role === 'ADMIN' ? (owner.trim() || undefined) : me.id
      };
      const d = await financeReport(params);
      setData(d);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{
    if(me) load();
  }, [me]); // Carga inicial cuando 'me' esté disponible

  return (
    <div style={{ padding: 24, display:"grid", gap:24 }}>
      <h1>Reporte Financiero</h1>
      <div className="card" style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems: "center" }}>
        <input type="month" value={from} onChange={e=>setFrom(e.target.value)} />
        <input type="month" value={to} onChange={e=>setTo(e.target.value)} />
        {me?.profile?.role === 'ADMIN' && (
          <input placeholder="Filtrar por ID de Propietario" value={owner} onChange={e=>setOwner(e.target.value)} />
        )}
        <button onClick={load} disabled={loading}>{loading ? "Generando..." : "Generar Reporte"}</button>
      </div>

      {loading ? <p>Cargando reporte...</p> : !data ? <p>No hay datos para mostrar.</p> : (
        <>
          <section className="card">
            <h3>Resumen General</h3>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <div><h4>Emitido:</h4><p style={{fontSize: 24, margin: 0, color: 'var(--brand-700)'}}>{money(data.overall.issued)}</p></div>
              <div><h4>Pagado:</h4><p style={{fontSize: 24, margin: 0, color: 'var(--brand-500)'}}>{money(data.overall.paid)}</p></div>
              <div><h4>Pendiente:</h4><p style={{fontSize: 24, margin: 0, color: '#ef4444'}}>{money(data.overall.outstanding)}</p></div>
            </div>
          </section>

          <section className="card">
            <h3>Desglose por Período</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              <FeesChart reportData={data} />
            </div>
          </section>

          <section className="card">
            <h3>Desglose por Tipo de Expensa</h3>
            <table className="table">
              <thead><tr><th>Tipo</th><th># Cuotas</th><th>Emitido</th><th>Pagado</th><th>Pendiente</th></tr></thead>
              <tbody>
                {data.by_type.map((r,i) => <tr key={i}><td>{r.type}</td><td>{r.count}</td><td>{money(r.issued)}</td><td>{money(r.paid)}</td><td>{money(r.outstanding)}</td></tr>)}
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  );
}