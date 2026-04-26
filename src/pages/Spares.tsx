import { useState } from 'react';
import { db, type Order, type Quotation, type OrderItem } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  CheckCircle2, 
  FileText, 
  ClipboardList,
  Euro,
  Trash2,
  X
} from 'lucide-react';

export default function SparesPage() {
  const [activeView, setActiveView] = useState<'orders' | 'quotations' | 'analytics'>('orders');
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewQuotation, setShowNewQuotation] = useState(false);
  
  const orders = useLiveQuery(() => db.orders.orderBy('id').reverse().toArray()) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const quotations = useLiveQuery(() => db.quotations.orderBy('id').reverse().toArray()) || [];

  return (
    <div className="spares-container">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => setActiveView('orders')}
          className={`nav-tab ${activeView === 'orders' ? 'active' : ''}`}
        >
          <ShoppingBag size={18} /> Pedidos de Compra
        </button>
        <button 
          onClick={() => setActiveView('quotations')}
          className={`nav-tab ${activeView === 'quotations' ? 'active' : ''}`}
        >
          <ClipboardList size={18} /> Presupuestos / Comparativas
        </button>
        <button 
          onClick={() => setActiveView('analytics')}
          className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`}
        >
          <Euro size={18} /> Control de Gastos
        </button>
      </div>

      {activeView === 'orders' && (
        <OrdersView 
          orders={orders} 
          orderItems={orderItems}
          suppliers={suppliers} 
          buildings={buildings}
          projects={projects}
          onNew={() => setShowNewOrder(true)} 
        />
      )}

      {activeView === 'quotations' && (
        <QuotationsView 
          quotations={quotations} 
          suppliers={suppliers}
          onNew={() => setShowNewQuotation(true)}
        />
      )}

      {activeView === 'analytics' && (
        <AnalyticsView 
          orderItems={orderItems}
          buildings={buildings}
        />
      )}

      {showNewOrder && (
        <NewOrderModal 
          suppliers={suppliers}
          buildings={buildings}
          projects={projects}
          onClose={() => setShowNewOrder(false)}
        />
      )}

      {showNewQuotation && (
        <NewQuotationModal 
          suppliers={suppliers}
          onClose={() => setShowNewQuotation(false)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-tab {
          padding: 1rem 0.5rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: var(--text-muted);
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .nav-tab.active {
          border-bottom-color: var(--accent);
          color: var(--text);
          font-weight: 700;
        }
        .nav-tab:hover:not(.active) {
          color: var(--accent);
        }
      `}} />
    </div>
  );
}

// --- VISTA DE PEDIDOS ---
function OrdersView({ orders, orderItems, suppliers, buildings, projects, onNew }: any) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const handleReceiveOrder = async (orderId: number) => {
    const albaran = prompt('Introduce el número de Albarán:');
    if (!albaran) return;
    
    await db.orders.update(orderId, {
      numeroAlbaran: albaran,
      fechaAlbaran: new Date().toISOString().split('T')[0],
      estado: 'recibido'
    });

    // Actualizar todas las líneas a recibido
    const items = await db.orderItems.where('idPedido').equals(orderId).toArray();
    for (const item of items) {
      await db.orderItems.update(item.id!, { estado: 'recibido' });
    }
    
    alert('Pedido marcado como RECIBIDO y albarán registrado.');
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="card" style={{ width: '100%', paddingLeft: '2.5rem' }} placeholder="Buscar pedido o albarán..." />
        </div>
        <button className="btn btn-primary" onClick={onNew}>
          <Plus size={20} /> Nuevo Pedido Multilínea
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Albarán</th>
              <th>Líneas</th>
              <th>Total Neto</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order: any) => {
              const supplier = suppliers.find((s: any) => s.id === order.idProveedor);
              const items = orderItems.filter((i: any) => i.idPedido === order.id);
              const total = items.reduce((sum: number, i: any) => sum + i.precioNeto, 0);
              
              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>#{order.numeroPedido}/{order.anio}</td>
                  <td>{order.fechaPedido}</td>
                  <td>{supplier?.nombre || '...'}</td>
                  <td>{order.numeroAlbaran || <span className="text-muted">Pendiente</span>}</td>
                  <td>{items.length} ud.</td>
                  <td style={{ fontWeight: 700 }}>{total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                  <td><span className={`status-badge status-${order.estado}`}>{order.estado.toUpperCase()}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setSelectedOrder(order)}>
                        Detalles
                      </button>
                      {order.estado === 'pendiente' && (
                        <button className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--success)', color: 'white' }} onClick={() => handleReceiveOrder(order.id)}>
                          <CheckCircle2 size={14} /> Recibir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          items={orderItems.filter((i: any) => i.idPedido === selectedOrder.id)}
          suppliers={suppliers}
          buildings={buildings}
          projects={projects}
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </>
  );
}

// --- MODAL DETALLES DE PEDIDO ---
function OrderDetailsModal({ order, items, suppliers, buildings, projects, onClose }: any) {
  const supplier = suppliers.find((s: any) => s.id === order.idProveedor);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Pedido #{order.numeroPedido}/{order.anio}</h2>
            <p className="text-muted">{supplier?.nombre} - {order.fechaPedido}</p>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card shadow-sm">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado General</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{order.estado.toUpperCase()}</div>
          </div>
          <div className="card shadow-sm">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Número de Albarán</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{order.numeroAlbaran || 'No registrado'}</div>
          </div>
          <div className="card shadow-sm">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entrega Estimada</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>{order.fechaEntregaEstimada || 'Sin fecha'}</div>
          </div>
        </div>

        <h3>Líneas del Pedido</h3>
        <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg)', fontSize: '0.75rem' }}>
              <tr>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>EDIFICIO / INSTALACIÓN</th>
                <th style={{ padding: '0.8rem', textAlign: 'left' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '0.8rem', textAlign: 'center' }}>UDS</th>
                <th style={{ padding: '0.8rem', textAlign: 'right' }}>NETO</th>
                <th style={{ padding: '0.8rem', textAlign: 'center' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => {
                const building = buildings.find((b: any) => b.id === item.idEdificio);
                const project = projects.find((p: any) => p.id === item.idObra);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.8rem' }}>
                      <div style={{ fontWeight: 600 }}>{building?.nombre || 'General'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{item.idInstalacion.toUpperCase()}</div>
                      {project && <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>OBRA: {project.nombreObra}</div>}
                    </td>
                    <td style={{ padding: '0.8rem' }}>{item.descripcion}</td>
                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>{item.unidades}</td>
                    <td style={{ padding: '0.8rem', textAlign: 'right', fontWeight: 700 }}>{item.precioNeto.toLocaleString()} €</td>
                    <td style={{ padding: '0.8rem', textAlign: 'center' }}>
                      <span className={`status-badge status-${item.estado}`}>{item.estado}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--bg)' }}>Exportar Albarán PDF</button>
          {order.estado === 'pendiente' && (
            <button className="btn btn-primary" style={{ background: 'var(--success)' }} onClick={() => { onClose(); /* Trigger same logic */ }}>
              Recibir Todo el Material
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>Cerrar Detalles</button>
        </div>
      </div>
    </div>
  );
}

// --- VISTA DE PRESUPUESTOS ---
function QuotationsView({ quotations, suppliers, onNew }: any) {
  const handleReceive = async (id: number) => {
    const importe = prompt('Introduce el importe total del presupuesto recibido:');
    if (importe) {
      await db.quotations.update(id, { 
        importeTotal: parseFloat(importe),
        estado: 'recibido',
        fechaRecepcion: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleAccept = async (q: any) => {
    if (!confirm('¿Deseas convertir este presupuesto en un pedido firme?')) return;
    
    const lastOrder = await db.orders.where('anio').equals(new Date().getFullYear()).last();
    const nextNum = (lastOrder?.numeroPedido || 0) + 1;

    const orderId = await db.orders.add({
      idPresupuesto: q.id,
      numeroPedido: nextNum,
      anio: new Date().getFullYear(),
      idProveedor: q.idProveedor,
      fechaPedido: new Date().toISOString().split('T')[0],
      estado: 'pendiente'
    } as Order);

    // Crear una línea genérica basada en la descripción del presupuesto
    await db.orderItems.add({
      idPedido: orderId as number,
      idEdificio: 0, // General por defecto
      idInstalacion: 'otros',
      descripcion: q.observaciones || 'Importado de presupuesto',
      unidades: 1,
      precioPVP: q.importeTotal,
      descuento: 0,
      precioNeto: q.importeTotal,
      estado: 'pendiente'
    } as OrderItem);

    await db.quotations.update(q.id, { estado: 'aceptado' });
    alert(`Pedido #${nextNum}/${new Date().getFullYear()} generado con éxito.`);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <p className="text-muted">Gestión de comparativas antes de formalizar la compra.</p>
        <button className="btn btn-primary" onClick={onNew}>
          <Plus size={20} /> Solicitar Nuevo Presupuesto
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {quotations.map((q: any) => {
          const supplier = suppliers.find((s: any) => s.id === q.idProveedor);
          return (
            <div key={q.id} className="card shadow-sm" style={{ borderLeft: `4px solid var(--${q.estado === 'recibido' ? 'success' : q.estado === 'rechazado' ? 'error' : 'warning'})` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{q.fechaSolicitud}</span>
                <span className={`status-badge status-${q.estado}`}>{q.estado.toUpperCase()}</span>
              </div>
              <h3 style={{ margin: '0.5rem 0' }}>{supplier?.nombre || 'Cargando...'}</h3>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)', margin: '0.5rem 0' }}>
                {q.importeTotal > 0 ? `${q.importeTotal.toLocaleString()} €` : 'Pendiente de precio'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{q.observaciones || 'Sin notas adicionales'}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {q.estado === 'solicitado' && (
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => handleReceive(q.id)}>
                    Marcar Recibido
                  </button>
                )}
                {q.estado === 'recibido' && (
                  <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem' }} onClick={() => handleAccept(q)}>
                    Aceptar y Generar Pedido
                  </button>
                )}
                <button className="btn" style={{ padding: '0.5rem', background: 'var(--bg)' }} title="Ver Documento">
                  <FileText size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// --- VISTA DE ANALÍTICAS ---
function AnalyticsView({ orderItems, buildings }: any) {
  const costPerBuilding = buildings.map((b: any) => {
    const total = orderItems
      .filter((i: any) => i.idEdificio === b.id)
      .reduce((sum: number, i: any) => sum + i.precioNeto, 0);
    return { name: b.nombre, total };
  }).sort((a: any, b: any) => b.total - a.total);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      <div className="card">
        <h3>Gastos por Edificio</h3>
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {costPerBuilding.map((item: any) => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
              </div>
              <span style={{ fontWeight: 700 }}>{item.total.toLocaleString()} €</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '2px dashed var(--border)' }}>
        <p className="text-muted">Gráficos de evolución mensual y por instalación próximamente.</p>
      </div>
    </div>
  );
}

// --- MODAL NUEVO PEDIDO MULTILÍNEA ---
function NewOrderModal({ suppliers, buildings, onClose }: any) {
  const [header, setHeader] = useState({
    idProveedor: 0,
    fechaPedido: new Date().toISOString().split('T')[0],
    fechaEntregaEstimada: '',
    observaciones: ''
  });

  const [items, setItems] = useState<any[]>([
    { idEdificio: 0, idInstalacion: 'otros', descripcion: '', unidades: 1, precioPVP: 0, descuento: 0, precioNeto: 0, idObra: undefined }
  ]);

  const addItem = () => {
    setItems([...items, { idEdificio: 0, idInstalacion: 'otros', descripcion: '', unidades: 1, precioPVP: 0, descuento: 0, precioNeto: 0, idObra: undefined }]);
  };

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(idx, 1);
      setItems(newItems);
    }
  };

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    
    // Auto-calc net
    if (['unidades', 'precioPVP', 'descuento'].includes(field)) {
      const { unidades, precioPVP, descuento } = newItems[idx];
      newItems[idx].precioNeto = unidades * precioPVP * (1 - (descuento / 100));
    }
    
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!header.idProveedor) return alert('Selecciona un proveedor');
    
    const lastOrder = await db.orders.where('anio').equals(new Date().getFullYear()).last();
    const nextNum = (lastOrder?.numeroPedido || 0) + 1;

    const orderId = await db.orders.add({
      ...header,
      numeroPedido: nextNum,
      anio: new Date().getFullYear(),
      estado: 'pendiente'
    } as Order);

    for (const item of items) {
      await db.orderItems.add({
        ...item,
        idPedido: orderId as number,
        estado: 'pendiente'
      } as OrderItem);
    }

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Nuevo Pedido de Compra Multilínea</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
          <div className="card shadow-sm" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Proveedor</label>
              <select className="form-control" onChange={e => setHeader({...header, idProveedor: Number(e.target.value)})}>
                <option value="">Seleccionar Proveedor...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha Pedido</label>
              <input type="date" className="form-control" value={header.fechaPedido} onChange={e => setHeader({...header, fechaPedido: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Entrega Estimada</label>
              <input type="date" className="form-control" onChange={e => setHeader({...header, fechaEntregaEstimada: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Desglose de Repuestos</h3>
            <button className="btn btn-primary" onClick={addItem}><Plus size={16} /> Añadir Línea</button>
          </div>

          <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'visible' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'var(--bg)', fontSize: '0.7rem' }}>
                <tr>
                  <th style={{ padding: '0.8rem', textAlign: 'left', width: '180px' }}>EDIFICIO</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', width: '150px' }}>INSTALACIÓN</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '80px' }}>UDS</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '100px' }}>PRECIO</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '80px' }}>DTO%</th>
                  <th style={{ padding: '0.8rem', textAlign: 'right', width: '100px' }}>NETO</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <select className="form-control" style={{ fontSize: '0.8rem' }} onChange={e => updateItem(idx, 'idEdificio', Number(e.target.value))}>
                        <option value="0">Seleccionar...</option>
                        {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <select className="form-control" style={{ fontSize: '0.8rem' }} onChange={e => updateItem(idx, 'idInstalacion', e.target.value)}>
                        <option value="otros">Otros</option>
                        <option value="alumbrado">Alumbrado</option>
                        <option value="climatizacion">Climatización</option>
                        <option value="incendios">Incendios</option>
                        <option value="fontaneria">Fontanería</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input className="form-control" style={{ fontSize: '0.8rem' }} value={item.descripcion} onChange={e => updateItem(idx, 'descripcion', e.target.value)} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" className="form-control" style={{ fontSize: '0.8rem', textAlign: 'center' }} value={item.unidades} onChange={e => updateItem(idx, 'unidades', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" className="form-control" style={{ fontSize: '0.8rem', textAlign: 'center' }} value={item.precioPVP} onChange={e => updateItem(idx, 'precioPVP', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" className="form-control" style={{ fontSize: '0.8rem', textAlign: 'center' }} value={item.descuento} onChange={e => updateItem(idx, 'descuento', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>
                      {item.precioNeto.toLocaleString()} €
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                      <button className="btn text-error" onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '2px solid var(--border)' }}>
          <div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Neto del Pedido</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent)' }}>
              {items.reduce((sum, i) => sum + i.precioNeto, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} style={{ padding: '1rem 2rem' }}>Generar Pedido Firme</button>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
        .text-error { color: var(--error) !important; }
      `}} />
    </div>
  );
}

// --- MODAL NUEVO PRESUPUESTO ---
function NewQuotationModal({ suppliers, onClose }: any) {
  const [data, setData] = useState({
    idProveedor: 0,
    fechaSolicitud: new Date().toISOString().split('T')[0],
    importeTotal: 0,
    observaciones: ''
  });

  const handleSave = async () => {
    if (!data.idProveedor) return alert('Selecciona un proveedor');
    await db.quotations.add({ ...data, estado: 'solicitado' } as Quotation);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Solicitar Presupuesto</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label>Proveedor</label>
            <select className="form-control" onChange={e => setData({...data, idProveedor: Number(e.target.value)})}>
              <option value="">Seleccionar...</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha de Solicitud</label>
            <input type="date" className="form-control" value={data.fechaSolicitud} onChange={e => setData({...data, fechaSolicitud: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Descripción / Observaciones</label>
            <textarea className="form-control" rows={3} onChange={e => setData({...data, observaciones: e.target.value})} />
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Guardar Solicitud</button>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
      `}} />
    </div>
  );
}
