import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Modal from 'react-modal';
import api from "../api";
import { fetchMe } from "../services/me";
import { listMyFees } from "../services/fees";

// --- Estilos para el Modal ---
const customModalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(320px, 90vw)',
    textAlign: 'center',
    borderRadius: '16px',
    border: '1px solid #ddd',
    padding: '24px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000
  }
};
Modal.setAppElement('#root');

// --- Componente Barra de Progreso ---
const PaymentProgressBar = ({ total, paid }) => {
  const percentage = total > 0 ? (paid / total) * 100 : 0;
  return (
    <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '99px', overflow: 'hidden', height: '10px', marginTop: '4px' }}>
      <div style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: percentage >= 100 ? 'var(--brand-500)' : '#f59e0b', height: '100%' }} />
    </div>
  );
};

export default function Fees() {
  const [me, setMe] = useState(null);
  const [mine, setMine] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState('');
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  useEffect(() => {
    fetchMe().then(setMe).catch(() => toast.error("No se pudo verificar tu sesión."));
  }, []);

  useEffect(() => {
    if (me) {
      listMyFees()
        .then(data => setMine(data.results || data))
        .catch(() => toast.error("Error al cargar tus cuotas."));
    }
  }, [me]);

  async function handleOnlinePay(fee) {
    setIsLoadingPayment(true);
    const toastId = toast.loading('Generando QR...');
    try {
      const { data } = await api.post(`fees/${fee.id}/create-payment-preference/`);
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64;
      
      if (qrBase64) {
        setQrCodeData(qrBase64);
        setIsModalOpen(true);
      } else {
        toast.error("El backend no devolvió un código QR.");
      }
    } catch (error) {
      toast.error("No se pudo iniciar el proceso de pago.");
    } finally {
      setIsLoadingPayment(false);
      toast.dismiss(toastId);
    }
  }

  if (!me) {
    return <div style={{padding: 24}}>Cargando...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Cuotas y Estado de Cuenta</h1>
      <section className="card">
        <h3>Mi estado de cuenta</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Unidad</th><th>Tipo</th><th>Periodo</th>
              <th>Monto / Pagado</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((f) => (
              <tr key={f.id}>
                <td>{f.unit_code}</td>
                <td>{f.expense_type_name}</td>
                <td>{f.period}</td>
                <td>
                  ${Number(f.amount).toFixed(2)} / ${Number(f.total_paid).toFixed(2)}
                  <PaymentProgressBar total={f.amount} paid={f.total_paid} />
                </td>
                <td><span className={`badge ${f.status === "PAID" ? "success" : "warn"}`}>{f.status}</span></td>
                <td>
                  {f.status !== 'PAID' && (
                    <button onClick={() => handleOnlinePay(f)} disabled={isLoadingPayment}>
                      Pagar Online
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!mine.length && <tr><td colSpan={6}>No tienes cuotas pendientes.</td></tr>}
          </tbody>
        </table>
      </section>

      <Modal 
        isOpen={isModalOpen} 
        onRequestClose={() => setIsModalOpen(false)}
        style={customModalStyles}
        contentLabel="Modal de Pago QR"
      >
        <h2 style={{marginTop: 0}}>Escanea para Pagar</h2>
        <p>Usa la app de tu banco o billetera móvil.</p>
        
        {qrCodeData ? (
          <img 
            src={`data:image/png;base64,${qrCodeData}`} 
            alt="Código QR de Pago para la demo"
            style={{
                width: '250px', 
                height: '250px', 
                margin: '16px auto', 
                border: '4px solid green', // Borde verde para que sea imposible no verlo
                padding: '4px', 
                borderRadius: '8px'
            }}
          />
        ) : (
          <div style={{padding: '40px', color: '#888'}}>Cargando QR...</div>
        )}
        
        <button onClick={() => setIsModalOpen(false)} style={{marginTop: '1rem', width: '100%'}}>Cerrar</button>
      </Modal>
    </div>
  );
}