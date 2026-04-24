import React, { useState } from 'react';
import { db, type Employee } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { User, Phone, CreditCard, Award, Plus, Trash2, FolderOpen, Edit3, Save, X, Shirt, Key } from 'lucide-react';

interface PersonalPageProps {
  onNavigateToRopa?: (empId: number) => void;
}

export default function PersonalPage({ onNavigateToRopa }: PersonalPageProps) {
  const employees = useLiveQuery(() => db.employees.toArray()) || [];
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar a este trabajador?')) {
      await db.employees.delete(id);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setModalMode('edit');
  };

  const handleOpenAdd = () => {
    setSelectedEmp(null);
    setModalMode('add');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedEmp(null);
  };

  return (
    <div className="personal-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de oficiales, titulaciones y equipos corporativos.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={20} /> Añadir Trabajador
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {employees.map(emp => (
          <div key={emp.id} className="card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleOpenEdit(emp)}
                style={{ border: 'none', background: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                title="Editar"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(emp.id!)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                {emp.nombre[0]}{emp.apellidos[0]}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{emp.nombre} {emp.apellidos}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{emp.profesion || 'Oficial'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.dni}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Phone size={14} style={{ color: 'var(--accent)' }} />
                <span>{emp.telefono || 'Sin teléfono'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Key size={14} style={{ color: 'var(--accent)' }} />
                <span>Llave EASMU: {emp.nllaveEASMU || '-'}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', pt: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <a 
                href="https://drive.google.com/drive/folders/1qp8yTcNgEf7IndtvgUHQSD1hwwVX75lM?usp=drive_link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn" 
                style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FolderOpen size={12} /> Títulos
              </a>
              <button 
                className="btn" 
                style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => onNavigateToRopa?.(emp.id!)}
              >
                <Shirt size={12} /> Ropa
              </button>
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', border: '2px dashed var(--border)', background: 'transparent' }}>
            <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No hay trabajadores registrados</h3>
            <p style={{ color: 'var(--text-muted)' }}>Importa tus oficiales desde un Excel o añádelos manualmente.</p>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{modalMode === 'add' ? 'Añadir Nuevo Trabajador' : 'Editar Trabajador'}</h2>
              <button className="btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                nombre: formData.get('nombre') as string,
                apellidos: formData.get('apellidos') as string,
                dni: formData.get('dni') as string,
                profesion: formData.get('profesion') as string,
                telefono: formData.get('telefono') as string,
                imei: formData.get('imei') as string,
                pinTelefono: formData.get('pinTelefono') as string,
                nllaveEASMU: formData.get('nllaveEASMU') as string,
                modeloTelefono: formData.get('modeloTelefono') as string,
                tarjetaAcceso: formData.get('tarjetaAcceso') as string,
                tallaRopa: selectedEmp?.tallaRopa || '', // Preserve existing or default
                titulaciones: selectedEmp?.titulaciones || [],
                guardias: selectedEmp?.guardias || []
              };

              if (modalMode === 'add') {
                await db.employees.add(data);
              } else if (selectedEmp?.id) {
                await db.employees.update(selectedEmp.id, data);
              }
              handleCloseModal();
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Nombre</label>
                  <input name="nombre" defaultValue={selectedEmp?.nombre} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input name="apellidos" defaultValue={selectedEmp?.apellidos} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>DNI</label>
                  <input name="dni" defaultValue={selectedEmp?.dni} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>Profesión</label>
                  <input name="profesion" defaultValue={selectedEmp?.profesion} className="card" style={{ width: '100%', padding: '8px' }} placeholder="Ej: Electricista, Fontanero..." />
                </div>
                <div className="form-group">
                  <label>Teléfono Corporativo</label>
                  <input name="telefono" defaultValue={selectedEmp?.telefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>PIN Teléfono</label>
                  <input name="pinTelefono" defaultValue={selectedEmp?.pinTelefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>IMEI Móvil</label>
                  <input name="imei" defaultValue={selectedEmp?.imei} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>Modelo Móvil</label>
                  <input name="modeloTelefono" defaultValue={selectedEmp?.modeloTelefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>Nº de llave EASMU</label>
                  <input name="nllaveEASMU" defaultValue={selectedEmp?.nllaveEASMU} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>ID Tarjeta Acceso</label>
                  <input name="tarjetaAcceso" defaultValue={selectedEmp?.tarjetaAcceso} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ marginRight: '10px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> {modalMode === 'add' ? 'Guardar Trabajador' : 'Actualizar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
