import { useState, useEffect } from 'react';
import { db, type MaintenanceBook, type InventoryItem } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  X, 
  Save, 
  RefreshCw, 
  History, 
  Plus, 
  ImageIcon,
  FileIcon,
  Printer,
  BookOpen,
  Settings,
  ClipboardList,
  Info,
  Package,
  Trash2
} from 'lucide-react';

interface Props {
  item: InventoryItem;
  onClose: () => void;
}

// --- Sub-componente para la gestión de Repuestos ---
function RepuestosView({ book, onUpdate }: { book: MaintenanceBook, onUpdate: (b: MaintenanceBook) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const orders = useLiveQuery(() => db.orders.where('estado').equals('recibido').toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];

  const handleAddSpare = (item: any) => {
    const order = orders.find(o => o.id === item.idPedido);
    const supplier = suppliers.find(s => s.id === order?.idProveedor);
    const newSpare = {
      orderId: item.idPedido,
      numeroPedido: order ? `${order.numeroPedido}/${order.anio}` : '?',
      descripcion: item.descripcion,
      fechaInstalacion: new Date().toISOString().split('T')[0],
      unidades: item.unidades,
      proveedorNombre: supplier?.nombre || 'Desconocido'
    };

    const updatedBook = {
      ...book,
      manualData: {
        ...book.manualData,
        repuestos: [...(book.manualData.repuestos || []), newSpare]
      }
    };
    onUpdate(updatedBook);
    setShowPicker(false);
  };

  const removeSpare = (index: number) => {
    const newRepuestos = [...book.manualData.repuestos];
    newRepuestos.splice(index, 1);
    onUpdate({
      ...book,
      manualData: {
        ...book.manualData,
        repuestos: newRepuestos
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Histórico de Repuestos Instalados</h3>
        <button className="btn btn-primary" onClick={() => setShowPicker(true)}>
          <Plus size={16} /> Vincular Repuesto de Compra
        </button>
      </div>

      <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg)', fontSize: '0.8rem' }}>
            <tr>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>FECHA INST.</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>PEDIDO</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>PARTE TRABAJO</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>DESCRIPCIÓN</th>
              <th style={{ padding: '0.8rem', textAlign: 'left' }}>PROVEEDOR</th>
              <th style={{ padding: '0.8rem', textAlign: 'center' }}>UDS</th>
              <th style={{ padding: '0.8rem', textAlign: 'right' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {book.manualData.repuestos?.map((spare, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                <td style={{ padding: '0.8rem' }}>{spare.fechaInstalacion}</td>
                <td style={{ padding: '0.8rem' }}>
                  {spare.orderId ? (
                    <button 
                      className="btn-link" 
                      onClick={() => window.dispatchEvent(new CustomEvent('erp-navigate', { detail: { tab: 'compras', view: 'orders', orderId: spare.orderId } }))}
                      style={{ fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                    >
                      #{spare.numeroPedido}
                    </button>
                  ) : (
                    `#${spare.numeroPedido}`
                  )}
                </td>
                <td style={{ padding: '0.8rem' }}>
                  {spare.workOrderId ? (
                    <button 
                      className="btn-link" 
                      onClick={() => window.dispatchEvent(new CustomEvent('erp-navigate', { detail: { tab: 'mantenimiento', workOrderId: spare.workOrderId } }))}
                      style={{ fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                    >
                      {spare.workOrderNo}
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={{ padding: '0.8rem' }}>{spare.descripcion}</td>
                <td style={{ padding: '0.8rem' }}>{spare.proveedorNombre}</td>
                <td style={{ padding: '0.8rem', textAlign: 'center' }}>{spare.unidades}</td>
                <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                  <button className="btn text-error" onClick={() => removeSpare(idx)} title="Eliminar vínculo">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {(!book.manualData.repuestos || book.manualData.repuestos.length === 0) && (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay repuestos vinculados a este equipo todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPicker && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Seleccionar Repuesto Recibido</h3>
              <button className="btn" onClick={() => setShowPicker(false)}><X size={24} /></button>
            </div>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Solo se muestran líneas de pedidos con estado <strong>RECIBIDO</strong>.
            </p>

            <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>Pedido</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>Descripción</th>
                    <th style={{ padding: '0.8rem', textAlign: 'left' }}>Albarán</th>
                    <th style={{ padding: '0.8rem', textAlign: 'right' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {useLiveQuery(() => db.orderItems.where('estado').equals('recibido').toArray())?.map(line => {
                    const order = orders.find(o => o.id === line.idPedido);
                    return (
                      <tr key={line.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.8rem' }}>#{order?.numeroPedido}/{order?.anio}</td>
                        <td style={{ padding: '0.8rem' }}>{line.descripcion}</td>
                        <td style={{ padding: '0.8rem' }}>{order?.numeroAlbaran || '-'}</td>
                        <td style={{ padding: '0.8rem', textAlign: 'right' }}>
                          <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleAddSpare(line)}>
                            Vincular
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No hay pedidos recibidos disponibles.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MaintenanceBookEditor({ item, onClose }: Props) {
  const [book, setBook] = useState<MaintenanceBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'technical' | 'docs' | 'plan' | 'repuestos' | 'logs'>('info');
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
            funcion: '',
            caracteristicasTecnicas: '',
            planMantenimiento: '',
            fotos: [],
            manuales: [],
            hojasTecnicas: [],
            registrosPreventivos: [],
            incidencias: [],
            averias: [],
            mediciones: [],
            actuacionesCorrectivas: [],
            repuestos: [],
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
  }, [item.idEquipo, item.edificio, item.tipoInstalacion, item.descripcion, item.localizacion, item.estado, item.fechaAlta, item.fechaBaja, item.sustituyeA, item.sustituidoPor, item.observaciones]);

  const handleSync = async () => {
    if (!book) return;
    setIsSyncing(true);
    
    // Perform sync
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
        await db.maintenanceBooks.put(book);
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.2rem' }}>
              <BookOpen size={20} /> LIBRO DE MANTENIMIENTO TÉCNICO
            </div>
            <h2 style={{ margin: 0 }}>{item.idEquipo}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Última sincronización con Inventario: {book ? new Date(book.fechaUltimaSincronizacion).toLocaleString() : 'Nunca'}</p>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          {[
            { id: 'info', label: 'Info General', icon: Info },
            { id: 'technical', label: 'Datos Técnicos', icon: Settings },
            { id: 'docs', label: 'Fotos & Manuales', icon: ImageIcon },
            { id: 'plan', label: 'Plan & Tareas', icon: ClipboardList },
            { id: 'repuestos', label: 'Repuestos Usados', icon: Package },
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
                <div className="form-group">
                  <label>Función en la Instalación</label>
                  <textarea 
                    className="form-control" 
                    rows={3}
                    placeholder="Ej: Impulsión de agua para climatización de zona norte..."
                    value={book?.manualData.funcion} 
                    onChange={e => setBook({...book!, manualData: {...book!.manualData, funcion: e.target.value}})} 
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Características Técnicas (Bloque B - No sobreescribible)</label>
                <textarea 
                  className="form-control" 
                  style={{ height: '240px' }}
                  value={book?.manualData.caracteristicasTecnicas} 
                  onChange={e => setBook({...book!, manualData: {...book!.manualData, caracteristicasTecnicas: e.target.value}})} 
                />
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0 }}>Galería de Fotos</h4>
                  <button className="btn" style={{ fontSize: '0.7rem' }}><ImageIcon size={14} /> Añadir Foto</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', background: 'var(--bg)', padding: '1rem', borderRadius: '8px', minHeight: '150px' }}>
                  {book?.manualData.fotos.length === 0 && <p className="text-muted" style={{ gridColumn: 'span 3', textAlign: 'center', fontSize: '0.8rem' }}>No hay fotos todavía.</p>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0 }}>Manuales del Fabricante</h4>
                    <button className="btn" style={{ fontSize: '0.7rem' }}><Plus size={14} /> Subir PDF</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {book?.manualData.manuales.length === 0 ? (
                      <div style={{ padding: '1rem', border: '1px dashed var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ningún manual adjunto</div>
                    ) : (
                      book?.manualData.manuales.map((m, i) => (
                        <div key={i} className="card shadow-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileIcon size={16} color="var(--error)" /> {m.nombre}</div>
                          <button className="btn text-error"><Trash2 size={14} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h4 style={{ marginBottom: '1rem' }}>Hojas Técnicas</h4>
                  <div style={{ padding: '1rem', border: '1px dashed var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ninguna hoja técnica adjunta</div>
                </div>
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

          {activeTab === 'repuestos' && (
            <RepuestosView 
              book={book!} 
              onUpdate={(updatedBook) => setBook(updatedBook)} 
            />
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn" style={{ background: 'var(--bg)' }}>
            <Printer size={18} /> Exportar Libro (PDF)
          </button>
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
