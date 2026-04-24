import React, { useState } from 'react';
import { db, type Vehicle } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Truck, Navigation, Calendar, PenTool as Tool, Plus, Save, Wrench, Edit3, X } from 'lucide-react';

interface Props {
  onNavigateToPartes?: () => void;
}

export default function VehiclesPage({ onNavigateToPartes }: Props) {
  const vehicles = useLiveQuery(() => db.vehicles.toArray()) || [];
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    matricula: '',
    modelo: '',
    color: '',
    kmsActuales: 0,
    ultimaFechaKms: new Date().toISOString().split('T')[0],
    proximaRevision: ''
  });

  const handleOpenAdd = () => {
    setSelectedVehicle(null);
    setFormData({
      matricula: '',
      modelo: '',
      color: '',
      kmsActuales: 0,
      ultimaFechaKms: new Date().toISOString().split('T')[0],
      proximaRevision: ''
    });
    setModalMode('add');
  };

  const handleOpenEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData(vehicle);
    setModalMode('edit');
  };

  const handleSave = async () => {
    if (modalMode === 'add') {
      await db.vehicles.add(formData as Vehicle);
    } else if (selectedVehicle?.id) {
      await db.vehicles.update(selectedVehicle.id, formData);
    }
    setModalMode(null);
  };

  return (
    <div className="vehicles-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)' }}>Control de flota: Kilometraje y revisiones periódicas de las furgonetas.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={20} /> Añadir Vehículo
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="card" style={{ position: 'relative' }}>
            <button 
              onClick={() => handleOpenEdit(vehicle)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <Edit3 size={18} />
            </button>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '12px', color: 'var(--accent)' }}>
                <Truck size={32} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>{vehicle.matricula}</div>
                <div style={{ color: 'var(--text-muted)' }}>{vehicle.modelo} ({vehicle.color})</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ background: 'var(--bg)', border: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Kilómetros</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{vehicle.kmsActuales.toLocaleString()}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Últ: {vehicle.ultimaFechaKms}</div>
              </div>
              <div className="card" style={{ background: 'var(--bg)', border: 'none', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Próx. Revisión</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent)' }}>{vehicle.proximaRevision || 'TBD'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => onNavigateToPartes?.()}>
                <Wrench size={16} /> Crear Parte de Trabajo
              </button>
            </div>
          </div>
        ))}

        {vehicles.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'var(--bg)', border: '2px dashed var(--border)' }}>
            <Truck size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No hay vehículos registrados</h3>
            <p style={{ color: 'var(--text-muted)' }}>Añade tus furgonetas de contrato para controlar sus mantenimientos.</p>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>{modalMode === 'add' ? 'Registrar Vehículo' : 'Editar Vehículo'}</h2>
              <button className="btn" onClick={() => setModalMode(null)}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Matrícula</label>
                <input className="card" style={{ width: '100%', padding: '0.75rem' }} value={formData.matricula} onChange={e => setFormData({...formData, matricula: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Modelo</label>
                <input className="card" style={{ width: '100%', padding: '0.75rem' }} value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Color</label>
                <input className="card" style={{ width: '100%', padding: '0.75rem' }} value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Kilómetros Iniciales</label>
                <input type="number" className="card" style={{ width: '100%', padding: '0.75rem' }} value={formData.kmsActuales} onChange={e => setFormData({...formData, kmsActuales: Number(e.target.value)})} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Próxima Revisión (Fecha)</label>
                <input type="date" className="card" style={{ width: '100%', padding: '0.75rem' }} value={formData.proximaRevision} onChange={e => setFormData({...formData, proximaRevision: e.target.value})} />
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setModalMode(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                <Save size={18} /> {modalMode === 'add' ? 'Guardar Vehículo' : 'Actualizar Vehículo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
