// src/components/UserDetailsModal.jsx
import Modal from 'react-modal';

const customStyles = {
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: 'min(500px, 90vw)'},
    overlay: { zIndex: 1000 }
};
Modal.setAppElement('#root');

export default function UserDetailsModal({ isOpen, onRequestClose, user }) {
    if (!user) return null;

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <h2>Detalles de {user.profile?.full_name || user.username}</h2>
            
            <div style={{ lineHeight: 1.8, marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <strong>Usuario:</strong> {user.username}<br />
                <strong>Email:</strong> {user.email}<br />
                <strong>Nombre Completo:</strong> {user.profile?.full_name || 'N/A'}<br />
                <strong>Teléfono:</strong> {user.profile?.phone || 'N/A'}<br />
                <strong>Rol:</strong> {user.profile?.role || 'N/A'}<br />
            </div>

            <div>
                <h4>Vehículos</h4>
                {user.vehicles?.length > 0 ? (
                    user.vehicles.map(v => <p key={v.id} style={{margin: '2px 0'}}>- {v.plate} ({v.brand})</p>)
                ) : <p style={{margin: '2px 0', color: '#6c757d'}}>No tiene vehículos registrados.</p>}
            </div>
            
            <div style={{marginTop: '15px'}}>
                <h4>Mascotas</h4>
                {user.pets?.length > 0 ? (
                    user.pets.map(p => <p key={p.id} style={{margin: '2px 0'}}>- {p.name} ({p.species})</p>)
                ) : <p style={{margin: '2px 0', color: '#6c757d'}}>No tiene mascotas registradas.</p>}
            </div>
            
            <div style={{marginTop: '15px'}}>
                <h4>Familiares</h4>
                {user.family_members?.length > 0 ? (
                    user.family_members.map(f => <p key={f.id} style={{margin: '2px 0'}}>- {f.full_name} ({f.relationship})</p>)
                ) : <p style={{margin: '2px 0', color: '#6c757d'}}>No tiene familiares registrados.</p>}
            </div>
            
            <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <button type="button" onClick={onRequestClose}>Cerrar</button>
            </div>
        </Modal>
    );
}