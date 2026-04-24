import React, { useState, useEffect } from 'react';
import { db, type InventoryItem, type MaintenanceBook } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  Save, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  History, 
  Plus, 
  FileText,
  Info
} from 'lucide-react';

interface Props {
  item: InventoryItem;
  onClose: () => void;
}

export default function MaintenanceBookEditor({ item, onClose }: Props) {
  const [book, setBook] = useState<MaintenanceBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'technical' | 'plan' | 'logs'>('info');
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch or create book
  useEffect(() => {
    const fetchBook = async () => {
      let existingBook = await db.maintenanceBooks.where('idEquipo').equals(item.idEquipo).first();
      
      if (!existingBook) {
        // Create initial book with automated sync (Block A)
        existingBook = {
          idEquipo: item.idEquipo,
          syncData: {
            edificio: item.edificio,
            tipoInstalacion: item.tipoInstalacion,
            descripcion: item.descripcion,
            localizacion: item.localizacion,
            estado: item.estado,
            fechaAlta: item.fechaAlta,
            fechaBaja: item.fechaBaja,
            sustituyeA: item.sustituyeA,
            sustituidoPor: item.sustituidoPor,
            observaciones: item.observaciones,
          },
          manualData: {
            fabricante: '',
            modelo: '',
            numeroSerie: '',
            caracteristicasTecnicas: '',
            planMantenimiento: '',
            registrosPreventivos: [],
            incidencias: [],
            averias: [],
            mediciones: [],
            actuacionesCorrectivas: [],
            modificaciones: [],
            anexos: [],
            historialDocumental: []
          },
          fechaUltimaSincronizacion: new Date().toISOString()
        };
      }
      
      setBook(existingBook);
      setLoading(false);
    };
    
    fetchBook();
  }, [item.idEquipo]);

  const handleSync = async () => {
    if (!book) return;
    setIsSyncing(true);
    
    // Simulate sync or just perform it
    const updatedBook = {
      ...book,
      syncData: {
        edificio: item.edificio,
        tipoInstalacion: item.tipoInstalacion,
        descripcion: item.descripcion,
        localizacion: item.localizacion,
        estado: item.estado,
        fechaAlta: item.fechaAlta,
        fechaBaja: item.fechaBaja,
        sustituyeA: item.sustituyeA,
        sustituidoPor: item.sustituidoPor,
        observaciones: item.observaciones,
      },
      fechaUltimaSincronizacion: new Date().toISOString()
    };
    
    setBook(updatedBook);
    
    // Log the sync
    await db.maintenanceBookSyncLogs.add({
      maintenanceBookId: book.id || 0,
      fecha: new Date().toISOString(),
      accion: 'SINCRONIZACIÓN_AUTO',
      detalles: 'Actualización de Bloque A desde Inventario'
    });

    // Audit Log
    await db.inventoryAuditLogs.add({
      fecha: new Date().toISOString(),
      usuario: 'SISTEMA',
      accion: 'SYNC_LIBRO_MANTENIMIENTO',
      itemSelector: item.idEquipo,
      resultado: 'EXITO'
    });

    setTimeout(() => setIsSyncing(false), 500);
  };

  const handleSave = async () => {
    if (!book) return;
    
    try {
      if (book.id) {
        await db.maintenanceBooks.update(book.id, book);
      } else {
        const id = await db.maintenanceBooks.add(book);
        setBook({ ...book, id: id as number });
        // Link item to book if it wasn't linked
        await db.inventoryItems.update(item.id!, { libroMantenimientoUrl: id.toString() });
      }
      
      alert('Libro de mantenimiento guardado correctamente.');
    } catch (err) {
      console.error(err);
      alert('Error al guardar el libro.');
    }
  };

  if (loading) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1000px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, mb: '0.2rem' }}>
              <BookOpen size={20} /> LIBRO DE MANTENIMIENTO TÉCNICO
            </div>
            <h2 style={{ margin: 0 }}>{item.idEquipo}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Última sincronización con Inventario: {book ? new Date(book.fechaUltimaSincronizacion).toLocaleString() : 'Nunca'}</p>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          {[
            { id: 'info', label: 'Info General (Bloque A)', icon: Info },
            { id: 'technical', label: 'Datos Técnicos (Bloque B)', icon: Settings },
            { id: 'plan', label: 'Plan & Tareas', icon: ClipboardList },
            { id: 'logs', label: 'Historial', icon: History }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ 
                padding: '1rem', 
                background: 'none', 
                border: 'none', 
                borderBottom: activeTab === tab.id ? '3px solid var(--accent)' : '3px solid transparent',
                color: activeTab === tab.id ? 'var(--text)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {activeTab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="card shadow-sm" style={{ background: 'rgba(2, 132, 199, 0.03)', border: '1px solid rgba(2, 132, 199, 0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--accent)' }}>Bloque A: Datos de Inventario</h4>
                  <button className={`btn ${isSyncing ? 'loading' : ''}`} style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem' }} onClick={handleSync}>
                    <RefreshCw size={12} className={isSyncing ? 'spin' : ''} /> Sincronizar Ahora
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem', fontSize: '0.85rem' }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Edificio:</strong> {book?.syncData.edificio}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Tipo Instalación:</strong> {book?.syncData.tipoInstalacion}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Descripción:</strong> {book?.syncData.descripcion}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Localización:</strong> {book?.syncData.localizacion}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Estado:</strong> <span className={`status-badge status-${book?.syncData.estado.toLowerCase()}`}>{book?.syncData.estado}</span></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="card shadow-sm">
                  <h4 style={{ margin: 0, marginBottom: '0.8rem' }}>Trazabilidad de Sustitución</h4>
                  <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Sustituye a:</strong> {book?.syncData.sustituyeA || 'Ninguno (Alta original)'}</div>
                    <div><strong style={{ color: 'var(--text-muted)' }}>Sustituido por:</strong> {book?.syncData.sustituidoPor || 'Activo'}</div>
                  </div>
                </div>
                <div className="card shadow-sm">
                  <h4 style={{ margin: 0, marginBottom: '0.8rem' }}>Observaciones de Inventario</h4>
                  <p style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{book?.syncData.observaciones || 'Sin observaciones'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'technical' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Fabricante</label>
                    <input 
                      className="form-control" 
                      value={book?.manualData.fabricante} 
                      onChange={e => setBook({...book!, manualData: {...book!.manualData, fabricante: e.target.value}})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Modelo</label>
                    <input 
                      className="form-control" 
                      value={book?.manualData.modelo} 
                      onChange={e => setBook({...book!, manualData: {...book!.manualData, modelo: e.target.value}})} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Número de Serie</label>
                    <input 
                      className="form-control" 
                      value={book?.manualData.numeroSerie} 
                      onChange={e => setBook({...book!, manualData: {...book!.manualData, numeroSerie: e.target.value}})} 
                    />
                  </div>
               </div>
               <div className="form-group">
                  <label>Características Técnicas (Bloque B - No sobreescribible)</label>
                  <textarea 
                    className="form-control" 
                    style={{ height: '200px' }}
                    value={book?.manualData.caracteristicasTecnicas} 
                    onChange={e => setBook({...book!, manualData: {...book!.manualData, caracteristicasTecnicas: e.target.value}})} 
                  />
               </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '2px dashed var(--border)' }}>
              <Plus size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
              <h3>Plan de Mantenimiento Preventivo</h3>
              <p className="text-muted">Próximamente: Define periodicidades, tareas y checklists automáticos.</p>
            </div>
          )}

          {activeTab === 'logs' && (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem', background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>Historial de Sincronización y Cambios</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'rgba(0,0,0,0.02)', fontSize: '0.75rem' }}>
                  <tr>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>FECHA</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>ACCIÓN</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>DETALLES</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.8rem' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.8rem' }}>{new Date().toLocaleDateString()}</td>
                    <td><span className="status-badge" style={{ background: 'var(--success)', color: 'white' }}>CREACIÓN</span></td>
                    <td>Apertura de libro de mantenimiento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', pt: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> Guardar Libro de Mantenimiento
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}
