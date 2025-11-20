// src/components/UserModal.jsx
import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { createVehicle, deleteVehicle, createPet, deletePet, createFamilyMember, deleteFamilyMember } from '../services/entities';

const customStyles = {
    content: { top: '50%', left: '50%', right: 'auto', bottom: 'auto', marginRight: '-50%', transform: 'translate(-50%, -50%)', width: 'min(600px, 90vw)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
    overlay: { zIndex: 1000 }
};
Modal.setAppElement('#root');

const RelatedItem = ({ children, onDelete }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa', padding: '4px 8px', borderRadius: '6px', marginBottom: '4px' }}>
        <span>{children}</span>
        <button type="button" onClick={onDelete} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '18px', padding: '0 8px' }}>&times;</button>
    </div>
);

export default function UserModal({ isOpen, onRequestClose, user, onSave, onDataChange }) {
    const [form, setForm] = useState({});
    const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '' });
    const [petForm, setPetForm] = useState({ name: '', species: '' });
    const [familyForm, setFamilyForm] = useState({ full_name: '', relationship: '' });

    useEffect(() => {
        if (user) {
            setForm({ username: user.username, email: user.email, password: '', full_name: user.profile?.full_name || '', role: user.profile?.role || 'RESIDENT', is_active: user.is_active });
        } else {
            setForm({ username: '', email: '', password: '', full_name: '', role: 'RESIDENT', is_active: true });
        }
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSubmit = (e) => { e.preventDefault(); onSave(form, user?.id); };

    const handleAdd = async (createFn, formState, setFormState, entityData, entityName) => {
        try {
            await createFn(entityData);
            setFormState({ ...Object.keys(formState).reduce((acc, key) => ({...acc, [key]: ''}), {}) });
            onDataChange();
        } catch (error) {
            const errorMsg = error.response?.data?.plate?.[0] || `Error al añadir ${entityName}. ¿El dato ya existe?`;
            alert(errorMsg);
        }
    };
    
    const handleDelete = async (deleteFn, id, entityName) => {
        if (window.confirm(`¿Eliminar este ${entityName}?`)) {
            try {
                await deleteFn(id);
                onDataChange();
            } catch (error) {
                alert(`No se pudo eliminar el ${entityName}.`);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onRequestClose={onRequestClose} style={customStyles}>
            <div style={{flex: '0 0 auto'}}>
                <h2>{user ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
            </div>
            
            <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '10px' }}>
                {/* Formulario principal de Usuario */}
                <form id="main-user-form" onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
                    <input name="username" value={form.username || ''} onChange={handleChange} placeholder="Nombre de usuario" required />
                    <input name="email" type="email" value={form.email || ''} onChange={handleChange} placeholder="Correo electrónico" required />
                    <input name="full_name" value={form.full_name || ''} onChange={handleChange} placeholder="Nombre completo" />
                    <input name="password" type="password" value={form.password || ''} onChange={handleChange} placeholder={user ? 'Nueva contraseña (no cambiar)' : 'Contraseña'} />
                    <select name="role" value={form.role} onChange={handleChange}>
                        <option value="RESIDENT">Residente</option><option value="ADMIN">Administrador</option><option value="STAFF">Personal</option>
                    </select>
                    <label><input name="is_active" type="checkbox" checked={form.is_active} onChange={handleChange} /> Usuario Activo</label>
                </form>

                {/* --- Secciones Adicionales (SOLO EN MODO EDICIÓN) --- */}
                {user && (
                    <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                        {/* Vehículos */}
                        <h4>Vehículos</h4>
                        {user.vehicles?.map(v => <RelatedItem key={v.id} onDelete={() => handleDelete(deleteVehicle, v.id, 'vehículo')}><strong>{v.plate}</strong> - {v.brand}</RelatedItem>)}
                        <form onSubmit={e => {e.preventDefault(); handleAdd(createVehicle, vehicleForm, setVehicleForm, {...vehicleForm, owner: user.id}, 'vehículo')}} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input value={vehicleForm.plate} onChange={e => setVehicleForm({...vehicleForm, plate: e.target.value})} placeholder="Placa" required />
                            <input value={vehicleForm.brand} onChange={e => setVehicleForm({...vehicleForm, brand: e.target.value})} placeholder="Marca" />
                            <button type="submit">Añadir</button>
                        </form>

                        {/* Mascotas */}
                        <h4 style={{marginTop: '20px'}}>Mascotas</h4>
                        {user.pets?.map(p => <RelatedItem key={p.id} onDelete={() => handleDelete(deletePet, p.id, 'mascota')}><strong>{p.name}</strong> - {p.species}</RelatedItem>)}
                        <form onSubmit={e => {e.preventDefault(); handleAdd(createPet, petForm, setPetForm, {...petForm, owner: user.id}, 'mascota')}} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input value={petForm.name} onChange={e => setPetForm({...petForm, name: e.target.value})} placeholder="Nombre" required />
                            <input value={petForm.species} onChange={e => setPetForm({...petForm, species: e.target.value})} placeholder="Especie" />
                            <button type="submit">Añadir</button>
                        </form>

                        {/* Familiares */}
                        <h4 style={{marginTop: '20px'}}>Familiares</h4>
                        {user.family_members?.map(f => <RelatedItem key={f.id} onDelete={() => handleDelete(deleteFamilyMember, f.id, 'familiar')}><strong>{f.full_name}</strong> - {f.relationship}</RelatedItem>)}
                        <form onSubmit={e => {e.preventDefault(); handleAdd(createFamilyMember, familyForm, setFamilyForm, {...familyForm, resident: user.id}, 'familiar')}} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <input value={familyForm.full_name} onChange={e => setFamilyForm({...familyForm, full_name: e.target.value})} placeholder="Nombre Completo" required />
                            <input value={familyForm.relationship} onChange={e => setFamilyForm({...familyForm, relationship: e.target.value})} placeholder="Parentesco" />
                            <button type="submit">Añadir</button>
                        </form>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px', flex: '0 0 auto' }}>
                <button type="button" onClick={onRequestClose}>Cancelar</button>
                <button type="submit" form="main-user-form">Guardar Cambios</button>
            </div>
        </Modal>
    );
}