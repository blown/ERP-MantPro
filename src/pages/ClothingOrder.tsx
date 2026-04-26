import { useState, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, Link as LinkIcon, Save, Shirt } from 'lucide-react';

export default function ClothingOrderPage() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [driveLink, setDriveLink] = useState('');
  const [fechaNotificacion, setFechaNotificacion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.clothingLink) setDriveLink(settings.clothingLink);
      if (settings.fechaNotificacionRopa) setFechaNotificacion(settings.fechaNotificacionRopa);
    }
  }, [settings]);

  const handleSave = async () => {
    if (!settings?.id) return;
    setIsSaving(true);
    try {
      await db.settings.update(settings.id, { 
        clothingLink: driveLink,
        fechaNotificacionRopa: fechaNotificacion 
      });
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el enlace');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenLink = () => {
    if (driveLink) {
      window.open(driveLink, '_blank');
    } else {
      alert('Por favor, introduce primero un enlace a Google Drive');
    }
  };

  return (
    <div className="clothing-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'var(--accent)', borderRadius: '16px', color: 'white' }}>
          <Shirt size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Gestión de Vestuario</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión centralizada de los pedidos de ropa a través de Google Drive.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LinkIcon className="text-accent" /> Enlace del Documento (Drive / SharePoint)
        </h2>
        
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Pega aquí el enlace a tu Excel de pedidos de ropa. De esta manera, podrás abrir y editar el documento original directamente sin tener que importarlo manualmente a la aplicación.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Enlace a Google Drive</label>
            <input 
              type="url" 
              className="form-control" 
              placeholder="https://docs.google.com/spreadsheets/d/..." 
              value={driveLink}
              onChange={e => setDriveLink(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fecha de Aviso (Aparecerá "PENDIENTE" en el Dashboard desde este día)</label>
            <input 
              type="date" 
              className="form-control" 
              value={fechaNotificacion}
              onChange={e => setFechaNotificacion(e.target.value)}
              style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', maxWidth: '300px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={isSaving || !settings}
            style={{ padding: '0.8rem 1.5rem' }}
          >
            <Save size={20} /> {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </div>

      {driveLink && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg)', border: '2px dashed var(--accent)' }}>
          <ExternalLink size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
          <h3 style={{ marginBottom: '1rem' }}>Tu documento está enlazado</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Haz clic en el botón de abajo para abrir el Excel de ropa en una nueva pestaña y modificar los datos.
          </p>
          <button className="btn btn-primary" onClick={handleOpenLink} style={{ fontSize: '1.1rem', padding: '1rem 2rem', borderRadius: '50px' }}>
            Abrir Documento de Vestuario <ExternalLink size={18} style={{ marginLeft: '0.5rem' }} />
          </button>
        </div>
      )}
    </div>
  );
}
