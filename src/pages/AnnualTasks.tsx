import { useState, useEffect } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ExternalLink, Link as LinkIcon, Save, Calendar, Shirt, CheckCircle, Shield, Flame } from 'lucide-react';

export default function AnnualTasksPage() {
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  
  // Prorrateo State
  const [prorrateoLink, setProrrateoLink] = useState('');
  const [fechaProrrateo, setFechaProrrateo] = useState('');
  
  // Ropa State
  const [ropaLink, setRopaLink] = useState('');
  const [fechaRopa, setFechaRopa] = useState('');
  
  // Guardia State
  const [fechaGuardia, setFechaGuardia] = useState('');
  const [guardiaLink, setGuardiaLink] = useState('');
  
  // Incendios State
  const [incendiosLink, setIncendiosLink] = useState('');
  const [fechaIncendios, setFechaIncendios] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.prorrateoLink) setProrrateoLink(settings.prorrateoLink);
      if (settings.fechaNotificacionProrrateo) setFechaProrrateo(settings.fechaNotificacionProrrateo);
      
      if (settings.clothingLink) setRopaLink(settings.clothingLink);
      if (settings.fechaNotificacionRopa) setFechaRopa(settings.fechaNotificacionRopa);

      if (settings.fechaNotificacionGuardia) setFechaGuardia(settings.fechaNotificacionGuardia);
      if (settings.guardiaLink) setGuardiaLink(settings.guardiaLink);

      if (settings.incendiosLink) setIncendiosLink(settings.incendiosLink);
      if (settings.fechaNotificacionIncendios) setFechaIncendios(settings.fechaNotificacionIncendios);
    }
  }, [settings]);

  const handleSave = async (type: 'prorrateo' | 'ropa' | 'guardia' | 'incendios') => {
    if (!settings?.id) return;
    setIsSaving(true);
    try {
      if (type === 'prorrateo') {
        await db.settings.update(settings.id, { 
          prorrateoLink: prorrateoLink,
          fechaNotificacionProrrateo: fechaProrrateo 
        });
      } else if (type === 'ropa') {
        await db.settings.update(settings.id, { 
          clothingLink: ropaLink,
          fechaNotificacionRopa: fechaRopa 
        });
      } else if (type === 'guardia') {
        await db.settings.update(settings.id, { 
          fechaNotificacionGuardia: fechaGuardia,
          guardiaLink: guardiaLink
        });
      } else if (type === 'incendios') {
        await db.settings.update(settings.id, { 
          incendiosLink: incendiosLink,
          fechaNotificacionIncendios: fechaIncendios 
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
  const isGuardiaPending = fechaGuardia ? todayStr >= fechaGuardia : false;
  const isIncendiosPending = fechaIncendios ? todayStr >= fechaIncendios : false;

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

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Tarea</th>
              <th style={{ width: '40%' }}>Enlace Google Drive</th>
              <th>Fecha de Aviso</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* PRORRATEO */}
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Calendar size={20} className="text-accent" />
                  <span style={{ fontWeight: 600 }}>Prorrateo Anual</span>
                </div>
              </td>
              <td>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://docs.google.com/..." 
                  value={prorrateoLink}
                  onChange={e => setProrrateoLink(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </td>
              <td>
                <input 
                  type="date" 
                  className="form-control" 
                  value={fechaProrrateo}
                  onChange={e => setFechaProrrateo(e.target.value)}
                />
              </td>
              <td>
                {isProrrateoPending ? (
                  <span className="status-badge status-pendiente">PENDIENTE</span>
                ) : (
                  <span className="status-badge status-terminada">AL DÍA</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleSave('prorrateo')} 
                    disabled={isSaving || !settings}
                    title="Guardar"
                  >
                    <Save size={18} />
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleOpenLink(prorrateoLink)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    title="Abrir Documento"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </td>
            </tr>

            {/* ROPA */}
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shirt size={20} className="text-success" />
                  <span style={{ fontWeight: 600 }}>Gestión de Vestuario</span>
                </div>
              </td>
              <td>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://docs.google.com/..." 
                  value={ropaLink}
                  onChange={e => setRopaLink(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </td>
              <td>
                <input 
                  type="date" 
                  className="form-control" 
                  value={fechaRopa}
                  onChange={e => setFechaRopa(e.target.value)}
                />
              </td>
              <td>
                {isRopaPending ? (
                  <span className="status-badge status-pendiente">PENDIENTE</span>
                ) : (
                  <span className="status-badge status-terminada">AL DÍA</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleSave('ropa')} 
                    disabled={isSaving || !settings}
                    style={{ background: 'var(--success)', color: 'white' }}
                    title="Guardar"
                  >
                    <Save size={18} />
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleOpenLink(ropaLink)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    title="Abrir Documento"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </td>
            </tr>

            {/* GUARDIA */}
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Shield size={20} style={{ color: '#6366f1' }} />
                  <span style={{ fontWeight: 600 }}>Actualización de Guardias</span>
                </div>
              </td>
              <td>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://docs.google.com/..." 
                  value={guardiaLink}
                  onChange={e => setGuardiaLink(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </td>
              <td>
                <input 
                  type="date" 
                  className="form-control" 
                  value={fechaGuardia}
                  onChange={e => setFechaGuardia(e.target.value)}
                />
              </td>
              <td>
                {isGuardiaPending ? (
                  <span className="status-badge status-pendiente">PENDIENTE</span>
                ) : (
                  <span className="status-badge status-terminada">AL DÍA</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleSave('guardia')} 
                    disabled={isSaving || !settings}
                    style={{ background: '#6366f1', color: 'white' }}
                    title="Guardar"
                  >
                    <Save size={18} />
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleOpenLink(guardiaLink)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    title="Abrir Documento"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </td>
            </tr>

            {/* INCENDIOS */}
            <tr>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Flame size={20} style={{ color: 'var(--error)' }} />
                  <span style={{ fontWeight: 600 }}>Gestión de Incendios</span>
                </div>
              </td>
              <td>
                <input 
                  type="url" 
                  className="form-control" 
                  placeholder="https://docs.google.com/..." 
                  value={incendiosLink}
                  onChange={e => setIncendiosLink(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </td>
              <td>
                <input 
                  type="date" 
                  className="form-control" 
                  value={fechaIncendios}
                  onChange={e => setFechaIncendios(e.target.value)}
                />
              </td>
              <td>
                {isIncendiosPending ? (
                  <span className="status-badge status-pendiente">PENDIENTE</span>
                ) : (
                  <span className="status-badge status-terminada">AL DÍA</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button 
                    className="btn" 
                    onClick={() => handleSave('incendios')} 
                    disabled={isSaving || !settings}
                    style={{ background: 'var(--error)', color: 'white' }}
                    title="Guardar"
                  >
                    <Save size={18} />
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => handleOpenLink(incendiosLink)}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                    title="Abrir Documento"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
