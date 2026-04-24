import React, { useState, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, Link as LinkIcon, Save, Calendar, Shirt, CheckCircle } from 'lucide-react';

export default function AnnualTasksPage() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  // Prorrateo State
  const [prorrateoLink, setProrrateoLink] = useState('');
  const [fechaProrrateo, setFechaProrrateo] = useState('');
  
  // Ropa State
  const [ropaLink, setRopaLink] = useState('');
  const [fechaRopa, setFechaRopa] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.prorrateoLink) setProrrateoLink(settings.prorrateoLink);
      if (settings.fechaNotificacionProrrateo) setFechaProrrateo(settings.fechaNotificacionProrrateo);
      
      if (settings.clothingLink) setRopaLink(settings.clothingLink);
      if (settings.fechaNotificacionRopa) setFechaRopa(settings.fechaNotificacionRopa);
    }
  }, [settings]);

  const handleSave = async (type: 'prorrateo' | 'ropa') => {
    if (!settings?.id) return;
    setIsSaving(true);
    try {
      if (type === 'prorrateo') {
        await db.settings.update(settings.id, { 
          prorrateoLink: prorrateoLink,
          fechaNotificacionProrrateo: fechaProrrateo 
        });
      } else {
        await db.settings.update(settings.id, { 
          clothingLink: ropaLink,
          fechaNotificacionRopa: fechaRopa 
        });
      }
      alert('Configuración guardada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenLink = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    } else {
      alert('Por favor, introduce primero un enlace a Google Drive');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isProrrateoPending = fechaProrrateo ? todayStr >= fechaProrrateo : false;
  const isRopaPending = fechaRopa ? todayStr >= fechaRopa : false;

  return (
    <div className="annual-tasks-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'var(--accent)', borderRadius: '16px', color: 'white' }}>
          <CheckCircle size={32} />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Tareas Anuales</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión centralizada de enlaces y avisos periódicos.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* TARJETA PRORRATEO */}
        <div className="card" style={{ border: isProrrateoPending ? '2px solid var(--error)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Calendar size={24} className="text-accent" />
            <h2 style={{ margin: 0 }}>Prorrateo Anual</h2>
            {isProrrateoPending && <span className="status-badge" style={{ background: '#fee2e2', color: '#991b1b', marginLeft: 'auto' }}>PENDIENTE</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                <LinkIcon size={16} /> Enlace a Drive
              </label>
              <input 
                type="url" 
                className="form-control" 
                placeholder="https://docs.google.com/..." 
                value={prorrateoLink}
                onChange={e => setProrrateoLink(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fecha de Aviso (Aparecerá en Dashboard)</label>
              <input 
                type="date" 
                className="form-control" 
                value={fechaProrrateo}
                onChange={e => setFechaProrrateo(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSave('prorrateo')} 
              disabled={isSaving || !settings}
            >
              <Save size={18} /> Guardar
            </button>
            <button 
              className="btn" 
              onClick={() => handleOpenLink(prorrateoLink)}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Abrir Documento <ExternalLink size={16} />
            </button>
          </div>
        </div>

        {/* TARJETA ROPA */}
        <div className="card" style={{ border: isRopaPending ? '2px solid var(--error)' : '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <Shirt size={24} className="text-success" />
            <h2 style={{ margin: 0 }}>Gestión de Vestuario</h2>
            {isRopaPending && <span className="status-badge" style={{ background: '#fee2e2', color: '#991b1b', marginLeft: 'auto' }}>PENDIENTE</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                <LinkIcon size={16} /> Enlace a Drive
              </label>
              <input 
                type="url" 
                className="form-control" 
                placeholder="https://docs.google.com/..." 
                value={ropaLink}
                onChange={e => setRopaLink(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Fecha de Aviso (Aparecerá en Dashboard)</label>
              <input 
                type="date" 
                className="form-control" 
                value={fechaRopa}
                onChange={e => setFechaRopa(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleSave('ropa')} 
              disabled={isSaving || !settings}
              style={{ background: 'var(--success)' }}
            >
              <Save size={18} /> Guardar
            </button>
            <button 
              className="btn" 
              onClick={() => handleOpenLink(ropaLink)}
              style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
            >
              Abrir Documento <ExternalLink size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
