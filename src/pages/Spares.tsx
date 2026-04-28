import { useState, useEffect } from 'react';
import { db, type Order, type Quotation, type OrderItem, type Project } from '../db';
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
  X,
  Building2,
  Phone,
  Mail,
  Edit,
  Download,
  Upload,
  Filter,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/dateUtils';

const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export default function SparesPage({ initialView, initialOrderId, onClearOrderId }: { initialView?: 'orders' | 'quotations' | 'analytics' | 'suppliers', initialOrderId?: number | null, onClearOrderId?: () => void }) {
  const [activeView, setActiveView] = useState<'orders' | 'quotations' | 'analytics' | 'suppliers'>(initialView || 'quotations');

  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
    
    // Lock body scroll to prevent browser scrollbar
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [initialView]);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [showNewQuotation, setShowNewQuotation] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<any>(null);
  
  const orders = useLiveQuery(() => db.orders.orderBy('id').reverse().toArray()) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const quotations = useLiveQuery(() => db.quotations.orderBy('id').reverse().toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  return (
    <div className="spares-container" style={{ height: 'calc(100vh - 120px)', overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '1rem', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => setActiveView('quotations')}
          className={`nav-tab ${activeView === 'quotations' ? 'active' : ''}`}
        >
          <ClipboardList size={18} /> Presupuestos / Comparativas
        </button>
        <button 
          onClick={() => setActiveView('orders')}
          className={`nav-tab ${activeView === 'orders' ? 'active' : ''}`}
        >
          <ShoppingBag size={18} /> Pedidos de Compra
        </button>
        <button 
          onClick={() => setActiveView('analytics')}
          className={`nav-tab ${activeView === 'analytics' ? 'active' : ''}`}
        >
          <Euro size={18} /> Control de Gastos
        </button>
        <button 
          onClick={() => setActiveView('suppliers')}
          className={`nav-tab ${activeView === 'suppliers' ? 'active' : ''}`}
        >
          <Building2 size={18} /> Directorio Proveedores
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeView === 'orders' && (
          <OrdersView 
            orders={orders} 
            orderItems={orderItems}
            suppliers={suppliers} 
            buildings={buildings}
            settings={settings}
            onNew={() => setShowNewOrder(true)} 
            quotations={quotations}
            initialOrderId={initialOrderId}
            onClearOrderId={onClearOrderId}
          />
        )}

        {activeView === 'quotations' && (
          <QuotationsView 
            quotations={quotations} 
            suppliers={suppliers}
            buildings={buildings}
            settings={settings}
            onNew={() => setShowNewQuotation(true)}
            onEdit={(q: any) => {
              setEditingQuotation(q);
              setShowNewQuotation(true);
            }}
            onOrderGenerated={() => setActiveView('orders')}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView 
            orderItems={orderItems}
            buildings={buildings}
            orders={orders}
            settings={settings}
          />
        )}

        {activeView === 'suppliers' && (
          <SuppliersView suppliers={suppliers} />
        )}
      </div>

      {showNewOrder && (
        <NewOrderModal 
          suppliers={suppliers}
          buildings={buildings}
          projects={projects}
          settings={settings}
          onClose={(shouldNavigate: boolean) => {
            setShowNewOrder(false);
            if (shouldNavigate) setActiveView('orders');
          }}
        />
      )}

      {showNewQuotation && (
        <QuotationModal 
          suppliers={suppliers} 
          buildings={buildings}
          settings={settings}
          onClose={() => setShowNewQuotation(false)} 
        />
      )}

      {editingQuotation && (
        <QuotationModal 
          suppliers={suppliers} 
          buildings={buildings}
          settings={settings}
          quotation={editingQuotation}
          onClose={() => setEditingQuotation(null)} 
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
        .tooltip-container {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .tooltip-text {
          visibility: hidden;
          width: 250px;
          background-color: var(--card-bg);
          color: var(--text);
          text-align: center;
          border-radius: 8px;
          padding: 8px;
          position: absolute;
          z-index: 100;
          bottom: 125%;
          right: 0;
          opacity: 0;
          transition: opacity 0.3s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border: 1px solid var(--border);
          font-size: 0.75rem;
          font-weight: 500;
          pointer-events: none;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}} />
    </div>
  );
}

// --- VISTA DE PEDIDOS ---
function OrdersView({ orders, orderItems, suppliers, buildings, settings, onNew, quotations, initialOrderId, onClearOrderId }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'partial' | 'received'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const areaNum = settings?.numeroArea || '00';

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const order = orders.find((o: any) => o.id === initialOrderId);
      if (order) {
        setSelectedOrder({ ...order, areaNum });
      }
    }
  }, [initialOrderId, orders, areaNum]);

  const filteredOrders = orders.filter((o: any) => {
    if (filter === 'pending') return o.estado === 'pendiente';
    if (filter === 'partial') return o.estado === 'parcialmente_recibido';
    if (filter === 'received') return o.estado === 'recibido';
    return true;
  });

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido? Se borrarán todas sus líneas y no se podrá recuperar.')) return;
    
    const items = await db.orderItems.where('idPedido').equals(orderId).toArray();
    for (const item of items) {
      if (item.id) await db.orderItems.delete(item.id);
    }
    await db.orders.delete(orderId);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="card" style={{ width: '100%', paddingLeft: '2.5rem' }} placeholder="Buscar pedido o albarán..." />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Filter size={16} className="text-muted" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtros:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
              <option value="all">Mostrar Todos</option>
              <option value="pending">Solo Pendientes (Rojo)</option>
              <option value="partial">Solo Parciales (Amarillo)</option>
              <option value="received">Solo Recibidos (Verde)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={() => {
            const flattenedData: any[] = [];
            orders.forEach((o: any) => {
              const supplier = suppliers.find((s: any) => s.id === o.idProveedor);
              const items = orderItems.filter((i: any) => i.idPedido === o.id);
              
              if (items.length === 0) {
                // Should not happen for multiline orders, but handle just in case
                flattenedData.push({
                  ID_Pedido: `${o.numeroPedido}/${areaNum}/${o.anio}`,
                  Fecha_Pedido: formatDate(o.fechaPedido),
                  Proveedor: supplier?.nombre || 'Desconocido',
                  Albaran: o.numeroAlbaran || '',
                  Fecha_Albaran: o.fechaAlbaran ? formatDate(o.fechaAlbaran) : '',
                  Estado_Pedido: o.estado.toUpperCase(),
                  Articulo: 'SIN LÍNEAS',
                  Unidades: 0,
                  Precio_Unitario: 0,
                  Descuento: 0,
                  Total_Neto_Linea: 0,
                  Observaciones: o.observaciones || ''
                });
              } else {
                items.forEach((i: any) => {
                  const building = buildings.find((b: any) => b.id === i.idEdificio);
                  flattenedData.push({
                    ID_Pedido: `${o.numeroPedido}/${areaNum}/${o.anio}`,
                    Fecha_Pedido: formatDate(o.fechaPedido),
                    Proveedor: supplier?.nombre || 'Desconocido',
                    Albaran: o.numeroAlbaran || '',
                    Fecha_Albaran: o.fechaAlbaran ? formatDate(o.fechaAlbaran) : '',
                    Estado_Pedido: o.estado.toUpperCase(),
                    Articulo: i.descripcion,
                    Edificio: building?.nombre || 'General',
                    Unidades: i.unidades,
                    Precio_Unitario: i.precioPVP,
                    Descuento: i.descuento,
                    Total_Neto_Linea: i.precioNeto,
                    Estado_Linea: i.estado.toUpperCase(),
                    Observaciones: o.observaciones || ''
                  });
                });
              }
            });
            exportToExcel(flattenedData, 'Pedidos_de_Compra_Detallado');
          }}>
            <Download size={20} /> Exportar
          </button>
          <button className="btn btn-primary" onClick={onNew}>
            <Plus size={20} /> Nuevo Pedido Multilínea
          </button>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <table>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ background: 'var(--bg)' }}>ID Pedido</th>
              <th style={{ background: 'var(--bg)' }}>Fecha Pedido</th>
              <th style={{ background: 'var(--bg)' }}>Entrega Est.</th>
              <th style={{ background: 'var(--bg)' }}>Proveedor</th>
              <th style={{ background: 'var(--bg)' }}>Albarán</th>
              <th style={{ background: 'var(--bg)' }}>Líneas</th>
              <th style={{ background: 'var(--bg)' }}>Total Neto</th>
              <th style={{ background: 'var(--bg)' }}>Estado</th>
              <th style={{ background: 'var(--bg)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order: any) => {
              const supplier = suppliers.find((s: any) => s.id === order.idProveedor);
              const items = orderItems.filter((i: any) => i.idPedido === order.id);
              const total = items.reduce((sum: number, i: any) => sum + i.precioNeto, 0);
              
              const linkedQuotation = quotations.find((q: any) => q.id === order.idPresupuesto);
              const isMismatch = linkedQuotation && Math.abs(total - linkedQuotation.importeTotal) > 0.01;

              const statusColors: any = {
                'pendiente': 'var(--error)',
                'parcialmente_recibido': 'var(--warning)',
                'recibido': 'var(--success)'
              };

              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{order.numeroPedido}/${areaNum}/${order.anio}</td>
                  <td>{formatDate(order.fechaPedido)}</td>
                  <td>{formatDate(order.fechaEntregaEstimada)}</td>
                  <td style={{ fontWeight: 700 }}>{supplier?.nombre || 'Cargando...'}</td>
                  <td>{order.numeroAlbaran || <span className="text-muted">Pendiente</span>}</td>
                  <td>{items.length} ud.</td>
                  <td style={{ fontWeight: 700, color: isMismatch ? 'var(--error)' : 'inherit' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {isMismatch && (
                        <div className="tooltip-container">
                          <AlertTriangle size={16} color="var(--error)" style={{ cursor: 'help' }} />
                          <span className="tooltip-text">El precio del pedido no coincide con el del presupuesto ({linkedQuotation.importeTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })})</span>
                        </div>
                      )}
                      {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </td>
                  <td><span className={`status-badge status-${order.estado}`}>{order.estado.toUpperCase()}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} onClick={() => {
                        setSelectedOrder({...order, areaNum});
                      }}>
                        Detalles
                      </button>
                      
                      <button 
                        className="btn" 
                        style={{ 
                          padding: '0.3rem 0.6rem', 
                          fontSize: '0.75rem', 
                          background: statusColors[order.estado] || 'var(--bg)', 
                          color: 'white' 
                        }} 
                        onClick={() => {
                          if (order.estado !== 'recibido') {
                            setSelectedOrder({...order, areaNum});
                          }
                        }}
                      >
                        {order.estado === 'recibido' ? 'Recibido' : 'Recibir'}
                      </button>

                      <button className="btn text-error" style={{ padding: '0.3rem', background: 'var(--bg)' }} title="Eliminar Pedido" onClick={() => handleDeleteOrder(order.id)}>
                        <Trash2 size={16} />
                      </button>
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
          settings={settings}
          onClose={() => {
            setSelectedOrder(null);
            if (onClearOrderId) onClearOrderId();
          }} 
        />
      )}
    </>
  );
}

// --- MODAL DETALLES DE PEDIDO ---
function OrderDetailsModal({ order, items: initialItems, suppliers, buildings, settings, onClose }: any) {
  const [localItems, setLocalItems] = useState(initialItems);
  const [localOrder, setLocalOrder] = useState({ ...order });
  const inventory = useLiveQuery(() => db.inventoryItems.where('estado').equals('ACTIVO').toArray()) || [];
  const supplier = suppliers.find((s: any) => s.id === order.idProveedor);

  const updateOrderStatus = async (orderId: number) => {
    const allItems = await db.orderItems.where('idPedido').equals(orderId).toArray();
    const allReceived = allItems.every(i => i.estado === 'recibido');
    const someReceived = allItems.some(i => i.estado === 'recibido');
    
    let newStatus: any = 'pendiente';
    if (allReceived) newStatus = 'recibido';
    else if (someReceived) newStatus = 'parcialmente_recibido';

    await db.orders.update(orderId, { estado: newStatus });
  };

  const handleUpdateItem = async (itemId: number, field: string, value: any) => {
    const item = localItems.find((i: any) => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, [field]: value };
    if (['precioPVP', 'descuento', 'unidades'].includes(field)) {
      updatedItem.precioNeto = updatedItem.unidades * updatedItem.precioPVP * (1 - (updatedItem.descuento / 100));
    }

    await db.orderItems.update(itemId, updatedItem);
    setLocalItems(localItems.map((i: any) => i.id === itemId ? updatedItem : i));
  };

  const handleReceiveItem = async (item: any) => {
    try {
      await db.orderItems.update(item.id, { estado: 'recibido' });
      const updatedItems = localItems.map((i: any) => i.id === item.id ? { ...i, estado: 'recibido' } : i);
      setLocalItems(updatedItems);
      
      // Update order status if all received
      const allReceived = updatedItems.every((i: any) => i.estado === 'recibido');
      const someReceived = updatedItems.some((i: any) => i.estado === 'recibido');
      let newStatus = allReceived ? 'recibido' : (someReceived ? 'parcialmente_recibido' : 'pendiente');
      
      setLocalOrder({ ...localOrder, estado: newStatus });
      await db.orders.update(order.id, { estado: newStatus });

      // Si tiene equipo vinculado, añadir al libro de mantenimiento
      if (item.idEquipo) {
        const book = await db.maintenanceBooks.where('idEquipo').equals(item.idEquipo).first();
        if (book) {
          const newSpare = {
            orderId: order.id,
            numeroPedido: `${order.numeroPedido}/${order.anio}`,
            descripcion: item.descripcion,
            fechaInstalacion: new Date().toISOString().split('T')[0],
            unidades: item.unidades,
            proveedorNombre: supplier?.nombre || 'Desconocido'
          };
          
          await db.maintenanceBooks.update(book.id!, {
            'manualData.repuestos': [...(book.manualData.repuestos || []), newSpare]
          });
          
          await db.maintenanceBookSyncLogs.add({
            maintenanceBookId: book.id!,
            fecha: new Date().toISOString(),
            accion: 'AÑADIDO_REPUESTO_AUTO',
            detalles: `Repuesto añadido automáticamente desde pedido #${order.numeroPedido}`
          });
        }
      }

      if (allReceived && !localOrder.numeroAlbaran) {
        const albaran = prompt('Pedido completado. Introduce el número de Albarán:');
        if (albaran) {
          setLocalOrder(prev => ({ ...prev, numeroAlbaran: albaran, fechaAlbaran: new Date().toISOString().split('T')[0] }));
        }
      }
    } catch (err) {
      console.error('Error al recibir ítem:', err);
    }
  };

  const handleReceiveAll = async () => {
    const albaran = prompt('Introduce el número de Albarán para todo el pedido:');
    if (!albaran) return;

    const today = new Date().toISOString().split('T')[0];
    const newStatus = 'recibido';

    setLocalOrder({
      ...localOrder,
      numeroAlbaran: albaran,
      fechaAlbaran: today,
      estado: newStatus
    });

    const updatedItems = localItems.map((item: any) => ({ ...item, estado: 'recibido' }));
    setLocalItems(updatedItems);

    // Persist status immediately to ensure integrity
    await db.orders.update(order.id, {
      numeroAlbaran: albaran,
      fechaAlbaran: today,
      estado: newStatus
    });

    for (const item of localItems) {
      await db.orderItems.update(item.id, { estado: 'recibido' });
    }
    
    alert('Pedido marcado como recibido.');
  };

  const handleFinalSave = async () => {
    await db.orders.update(order.id, {
      numeroAlbaran: localOrder.numeroAlbaran,
      fechaAlbaran: localOrder.fechaAlbaran,
      fechaEntregaEstimada: localOrder.fechaEntregaEstimada,
      estado: localOrder.estado
    });
    onClose();
  };

  const totalPedido = localItems.reduce((sum: number, i: any) => sum + i.precioNeto, 0);

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Pedido #{order.numeroPedido}/{order.areaNum}/{order.anio}</h2>
            <p className="text-muted">{supplier?.nombre} - {formatDate(order.fechaPedido)}</p>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div className="card shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85px', padding: '1rem', borderLeft: `4px solid ${order.estado === 'recibido' ? 'var(--success)' : order.estado === 'parcialmente_recibido' ? 'var(--warning)' : 'var(--error)'}` }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estado General</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem', color: order.estado === 'recibido' ? 'var(--success)' : 'inherit' }}>{order.estado.toUpperCase()}</div>
          </div>
          
          <div className="card shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categoría</div>
            <div style={{ fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent)', fontSize: '0.95rem', lineHeight: 1.2 }}>
              {Array.from(new Set(localItems.map((i: any) => i.tipoRepuesto).filter(Boolean))).length > 1 
                ? 'Múltiples...' 
                : (localItems[0]?.tipoRepuesto || 'Sin categoría')}
            </div>
          </div>

          <div className="card shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Número de Albarán</div>
            <input 
              className="form-control" 
              style={{ fontWeight: 700, marginTop: '0.2rem', border: 'none', background: 'transparent', padding: 0, height: 'auto', fontSize: '1rem' }} 
              value={localOrder.numeroAlbaran || ''} 
              placeholder="Pendiente..."
              onChange={e => setLocalOrder({...localOrder, numeroAlbaran: e.target.value})}
            />
          </div>

          <div className="card shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85px', padding: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha de Albarán</div>
            <input 
              type="date"
              className="form-control" 
              style={{ fontWeight: 700, marginTop: '0.2rem', border: 'none', background: 'transparent', padding: 0, height: 'auto', fontSize: '0.9rem' }} 
              value={localOrder.fechaAlbaran || ''} 
              onChange={e => setLocalOrder({...localOrder, fechaAlbaran: e.target.value})}
            />
          </div>

          <div className="card shadow-sm" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '85px', padding: '1rem', background: 'var(--accent)', color: 'white' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8 }}>Total Neto</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{totalPedido.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Líneas del Pedido (Edición de precios permitida)</h3>
          {order.estado !== 'recibido' && (
            <button className="btn" style={{ background: 'var(--success)', color: 'white', padding: '0.5rem 1rem' }} onClick={handleReceiveAll}>
              <CheckCircle2 size={16} /> Recibir TODO el Pedido
            </button>
          )}
        </div>

        <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg)', fontSize: '0.7rem' }}>
              <tr>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'left', width: '120px' }}>EDIFICIO</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'left' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'left', width: '180px' }}>VINCULAR EQUIPO</th>
                <th style={{ padding: '0.6rem 0.2rem', textAlign: 'center', width: '45px' }}>UDS</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '90px' }}>PRECIO</th>
                <th style={{ padding: '0.6rem 0.2rem', textAlign: 'center', width: '50px' }}>DTO%</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'right', width: '85px' }}>NETO</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '95px' }}>ESTADO</th>
                <th style={{ padding: '0.6rem 0.4rem', textAlign: 'center', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {localItems.map((item: any) => {
                const building = buildings.find((b: any) => b.id === item.idEdificio);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <td style={{ padding: '0.8rem' }}>
                      <div style={{ fontWeight: 600 }}>{building?.nombre || 'General'}</div>
                    </td>
                    <td style={{ padding: '0.8rem' }}>{item.descripcion}</td>
                    <td style={{ padding: '0.8rem' }}>
                      <select 
                        className="form-control" 
                        style={{ fontSize: '0.75rem', padding: '0.2rem' }}
                        value={item.idEquipo || ''}
                        onChange={e => handleUpdateItem(item.id, 'idEquipo', e.target.value)}
                      >
                        <option value="">-- No vincular --</option>
                        {inventory.map((inv: any) => (
                          <option key={inv.id} value={inv.idEquipo}>{inv.idEquipo} - {inv.descripcion.substring(0, 30)}...</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem 0.2rem', textAlign: 'center' }}>
                      <input type="number" className="form-control" style={{ textAlign: 'center', padding: '0.2rem 0', fontSize: '0.8rem', width: '100%' }} value={item.unidades} onChange={e => handleUpdateItem(item.id, 'unidades', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                      <input type="number" className="form-control" style={{ textAlign: 'center', padding: '0.25rem', fontSize: '0.8rem' }} value={item.precioPVP} onChange={e => handleUpdateItem(item.id, 'precioPVP', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem 0.2rem', textAlign: 'center' }}>
                      <input type="number" className="form-control" style={{ textAlign: 'center', padding: '0.2rem 0', fontSize: '0.8rem', width: '100%' }} value={item.descuento} onChange={e => handleUpdateItem(item.id, 'descuento', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'right', fontWeight: 700, fontSize: '0.8rem' }}>{item.precioNeto.toLocaleString()} €</td>
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                      <span className={`status-badge status-${item.estado}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.3rem' }}>{item.estado.toUpperCase()}</span>
                    </td>
                    <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                      {item.estado === 'pendiente' && (
                        <button className="btn" style={{ padding: '0.4rem', background: 'var(--success)', color: 'white' }} title="Marcar como Recibido" onClick={() => handleReceiveItem(item)}>
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn btn-primary" onClick={handleFinalSave}>Cerrar y Guardar</button>
        </div>
      </div>
    </div>
  );
}

// --- VISTA DE PRESUPUESTOS ---
function QuotationsView({ quotations, suppliers, buildings, settings, onNew, onEdit, onOrderGenerated }: any) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'received'>('all');
  const areaNum = settings?.numeroArea || '00';

  const filteredQuotations = quotations.filter((q: any) => {
    if (filter === 'pending') return q.estado === 'solicitado';
    if (filter === 'received') return q.estado === 'recibido' || q.estado === 'aceptado';
    return true;
  });
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
    if (!confirm(`¿Convertir presupuesto de ${suppliers.find((s:any)=>s.id===q.idProveedor)?.nombre} en Pedido de Compra?`)) return;

    const allOrders = await db.orders.toArray();
    const nextNum = allOrders.length > 0 ? Math.max(...allOrders.map(o => o.numeroPedido)) + 1 : 1;
    const currentYear = new Date().getFullYear();

    const orderId = await db.orders.add({
      idPresupuesto: q.id,
      numeroPedido: nextNum,
      anio: currentYear,
      idProveedor: q.idProveedor,
      fechaPedido: new Date().toISOString().split('T')[0],
      fechaEntregaEstimada: q.fechaEntregaEstimada || '',
      estado: 'pendiente'
    } as Order);

    if (q.lineas && q.lineas.length > 0) {
      for (const linea of q.lineas) {
        await db.orderItems.add({
          idPedido: orderId as number,
          idEdificio: linea.idEdificio || 0,
          idInstalacion: 'otros',
          tipoRepuesto: linea.tipoRepuesto || '',
          descripcion: linea.descripcion,
          unidades: linea.unidades,
          precioPVP: 0,
          descuento: 0,
          precioNeto: 0,
          estado: 'pendiente'
        } as OrderItem);
      }
    } else {
      await db.orderItems.add({
        idPedido: orderId as number,
        idEdificio: 0,
        idInstalacion: 'otros',
        descripcion: q.observaciones || 'Importado de presupuesto',
        unidades: 1,
        precioPVP: q.importeTotal,
        descuento: 0,
        precioNeto: q.importeTotal,
        estado: 'pendiente'
      } as OrderItem);
    }

    await db.quotations.update(q.id, { estado: 'aceptado' });
    alert(`Pedido #${nextNum}/${areaNum}/${currentYear} generado con éxito.`);
    onOrderGenerated();
  };

  const handleConvertToProject = async (q: any) => {
    if (!confirm(`¿Convertir presupuesto de ${suppliers.find((s:any)=>s.id===q.idProveedor)?.nombre} en una nueva Obra?`)) return;

    await db.projects.add({
      idPresupuesto: q.id,
      nombreObra: q.observaciones || `Obra desde Presupuesto #${q.id}`,
      idEdificio: q.lineas?.[0]?.idEdificio || 0,
      estado: 'pendiente',
      estadoPreparacion: 'preparar',
      porcentajeGanancia: 15, // Por defecto 15%
      beneficioCalculado: 0,
      descripcion: q.observaciones || '',
      items: q.lineas?.map((l: any) => ({
        descripcion: l.descripcion,
        unidades: l.unidades,
        precioNeto: (q.lineas.length === 1) ? q.importeTotal : 0, // Si es una línea, asumimos el total
        idEdificio: l.idEdificio || 0
      })) || [],
      documentos: []
    } as Project);

    await db.quotations.update(q.id, { estado: 'en_obra' });
    alert('Convertido en Obra con éxito. Los datos se han transferido al módulo de Obras.');
  };

  const handleDeleteQuotation = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este presupuesto? No se podrá recuperar.')) return;
    await db.quotations.delete(id);
  };

  const handleFileUpload = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecciona un archivo PDF.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      await db.quotations.update(id, { documentoUrl: base64String });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleOpenPdf = (base64Url: string) => {
    fetch(base64Url)
      .then(res => res.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      });
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <p className="text-muted" style={{ margin: 0 }}>Gestión de comparativas antes de formalizar la compra.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Filter size={16} className="text-muted" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtros:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }} value={filter} onChange={e => setFilter(e.target.value as any)}>
              <option value="all">Mostrar Todos</option>
              <option value="pending">Solo Pendientes (Rojo)</option>
              <option value="received">Solo Recibidos/Aceptados (Verde)</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={() => {
            const data = quotations.map((q: any) => {
              const supplier = suppliers.find((s: any) => s.id === q.idProveedor);
              return {
                ID_Presupuesto: q.id,
                Fecha_Solicitud: q.fechaSolicitud,
                Fecha_Entrega_Est: q.fechaEntregaEstimada || '',
                Proveedor: supplier?.nombre || 'Desconocido',
                Importe_Total: q.importeTotal,
                Estado: q.estado.toUpperCase(),
                Fecha_Recepcion: q.fechaRecepcion || '',
                Observaciones: q.observaciones || ''
              };
            });
            exportToExcel(data, 'Presupuestos');
          }}>
            <Download size={20} /> Exportar
          </button>
          <button className="btn btn-primary" onClick={onNew}>
            <Plus size={20} /> Solicitar Nuevo Presupuesto
          </button>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <table>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ background: 'var(--bg)' }}>Fecha</th>
              <th style={{ background: 'var(--bg)' }}>Proveedor</th>
              <th style={{ background: 'var(--bg)' }}>Componentes</th>
              <th style={{ background: 'var(--bg)' }}>Entrega Est.</th>
              <th style={{ background: 'var(--bg)' }}>Importe Total</th>
              <th style={{ background: 'var(--bg)' }}>Estado</th>
              <th style={{ background: 'var(--bg)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotations.map((q: any) => {
              const supplier = suppliers.find((s: any) => s.id === q.idProveedor);
              return (
                <tr key={q.id}>
                  <td>{formatDate(q.fechaSolicitud)}</td>
                  <td style={{ fontWeight: 600 }}>{supplier?.nombre || 'Cargando...'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                      {q.lineas?.map((l: any, i: number) => {
                        const b = buildings.find((eb: any) => eb.id === l.idEdificio);
                        return <div key={i}>• {l.unidades}x {l.descripcion} <span style={{ color: 'var(--accent)', fontWeight: 600 }}>({b?.nombre || 'General'})</span></div>
                      })}
                    </div>
                  </td>
                  <td>{formatDate(q.fechaEntregaEstimada) || <span className="text-muted">-</span>}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                    {q.importeTotal > 0 ? `${q.importeTotal.toLocaleString()} €` : 'Pendiente'}
                  </td>
                  <td>
                    <span className={`status-badge status-${q.estado}`}>{q.estado.toUpperCase()}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button 
                        className="btn" 
                        style={{ 
                          padding: '0.3rem 0.6rem', 
                          fontSize: '0.75rem',
                          background: q.estado === 'solicitado' ? 'var(--error)' : 'var(--success)',
                          color: 'white'
                        }} 
                        onClick={() => handleReceive(q.id)}
                      >
                        {q.estado === 'solicitado' ? 'Recibir' : 'Recibido'}
                      </button>
                      
                      {q.estado !== 'solicitado' && (
                        <>
                          <button 
                            className="btn" 
                            style={{ 
                              padding: '0.3rem 0.6rem', 
                              fontSize: '0.75rem',
                              background: q.estado === 'aceptado' ? 'var(--success)' : 'var(--error)',
                              color: 'white'
                            }} 
                            onClick={() => q.estado !== 'aceptado' && handleAccept(q)}
                          >
                            Pedido
                          </button>
                          <button 
                            className="btn" 
                            style={{ 
                              padding: '0.3rem 0.6rem', 
                              fontSize: '0.75rem',
                              background: q.estado === 'en_obra' ? 'var(--success)' : 'var(--error)',
                              color: 'white'
                            }} 
                            onClick={() => q.estado !== 'en_obra' && handleConvertToProject(q)}
                          >
                            Obra
                          </button>
                        </>
                      )}

                      <button className="btn" style={{ padding: '0.3rem', background: 'var(--bg)' }} title="Editar Presupuesto" onClick={() => onEdit(q)}>
                        <Edit size={16} />
                      </button>
                      
                      {q.documentoUrl ? (
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button className="btn" style={{ padding: '0.3rem 0.5rem', background: 'var(--accent)', color: 'white' }} title="Ver Oferta PDF" onClick={() => handleOpenPdf(q.documentoUrl)}>
                            <FileText size={16} />
                          </button>
                          <label className="btn" style={{ padding: '0.3rem 0.5rem', background: 'var(--bg)', cursor: 'pointer' }} title="Reemplazar PDF">
                            <Upload size={16} />
                            <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(q.id, e)} />
                          </label>
                        </div>
                      ) : (
                        <label className="btn" style={{ padding: '0.3rem 0.5rem', background: 'var(--bg)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem' }} title="Subir PDF">
                          <Upload size={16} /> <span style={{ fontSize: '0.75rem' }}>Adjuntar</span>
                          <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => handleFileUpload(q.id, e)} />
                        </label>
                      )}
                      <button className="btn text-error" style={{ padding: '0.3rem', background: 'var(--bg)' }} title="Eliminar Presupuesto" onClick={() => handleDeleteQuotation(q.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// --- VISTA DE ANALÍTICAS ---
function AnalyticsView({ orderItems, buildings, settings, orders }: any) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(-1); // -1 for all year
  
  const spareTypes = settings?.tiposRepuesto || ['Climatización', 'Incendios', 'Electricidad', 'Alumbrado', 'Fontanería'];
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Filter items based on order date
  const filteredItems = orderItems.filter((item: any) => {
    const order = orders.find((o: any) => o.id === item.idPedido);
    if (!order) return false;
    
    const orderDate = new Date(order.fechaPedido);
    const matchesYear = orderDate.getFullYear() === selectedYear;
    const matchesMonth = selectedMonth === -1 || orderDate.getMonth() === selectedMonth;
    
    return matchesYear && matchesMonth;
  });

  // Calculate totals
  const costPerBuilding = buildings.map((b: any) => {
    const total = filteredItems
      .filter((i: any) => i.idEdificio === b.id)
      .reduce((sum: number, i: any) => sum + i.precioNeto, 0);
    return { name: b.nombre, id: b.id, total };
  }).sort((a: any, b: any) => b.total - a.total);

  const costPerCategory = spareTypes.map((t: string) => {
    const total = filteredItems
      .filter((i: any) => i.tipoRepuesto === t)
      .reduce((sum: number, i: any) => sum + i.precioNeto, 0);
    return { name: t, total };
  }).sort((a: any, b: any) => b.total - a.total);

  const totalGlobal = costPerBuilding.reduce((sum: number, item: any) => sum + item.total, 0);

  const handleExportAnalytics = () => {
    const exportData: any[] = [];
    
    // Cross table data
    spareTypes.forEach((t: string) => {
      const row: any = { "Categoría": t };
      let hasData = false;
      buildings.forEach((b: any) => {
        const amount = filteredItems
          .filter((i: any) => i.idEdificio === b.id && i.tipoRepuesto === t)
          .reduce((sum: number, i: any) => sum + i.precioNeto, 0);
        row[b.nombre] = amount;
        if (amount > 0) hasData = true;
      });
      
      if (hasData) {
        row["TOTAL"] = buildings.reduce((sum: number, b: any) => sum + row[b.nombre], 0);
        exportData.push(row);
      }
    });

    const monthName = selectedMonth === -1 ? "Todo el año" : months[selectedMonth];
    exportToExcel(exportData, `Analitica_Gastos_${monthName}_${selectedYear}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Filter size={18} className="text-muted" />
            <span style={{ fontWeight: 600 }}>Periodo:</span>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-control" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              style={{ minWidth: '150px' }}
            >
              <option value={-1}>Todo el año</option>
              {months.map((m, idx) => <option key={m} value={idx}>{m}</option>)}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <select 
              className="form-control" 
              value={selectedYear} 
              onChange={e => setSelectedYear(Number(e.target.value))}
              style={{ minWidth: '100px' }}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleExportAnalytics}>
          <Download size={20} /> Exportar Analítica (Excel)
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
        <div className="card shadow-sm" style={{ background: 'var(--accent)', color: 'white' }}>
          <div className="card-title" style={{ color: 'rgba(255,255,255,0.8)' }}>Gasto en el Periodo</div>
          <div className="card-value" style={{ color: 'white' }}>{totalGlobal.toLocaleString()} €</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>
            {selectedMonth === -1 ? `Total año ${selectedYear}` : `${months[selectedMonth]} ${selectedYear}`}
          </div>
        </div>
        <div className="card shadow-sm">
          <div className="card-title">Categoría Principal</div>
          <div className="card-value" style={{ fontSize: '1.5rem' }}>{costPerCategory.find(c => c.total > 0)?.name || '-'}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>{costPerCategory.find(c => c.total > 0)?.total.toLocaleString() || 0} € gastados</div>
        </div>
        <div className="card shadow-sm">
          <div className="card-title">Edificio con más Gasto</div>
          <div className="card-value" style={{ fontSize: '1.5rem' }}>{costPerBuilding.find(b => b.total > 0)?.name || '-'}</div>
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>{costPerBuilding.find(b => b.total > 0)?.total.toLocaleString() || 0} € gastados</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Breakdown per Building */}
        <div className="card shadow-sm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Gasto por Edificio</h3>
            <Euro size={20} className="text-muted" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {costPerBuilding.map((item: any) => (
              <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ fontWeight: 600 }}>{item.name}</span>
                  <span style={{ fontWeight: 700 }}>{item.total.toLocaleString()} €</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${totalGlobal > 0 ? (item.total / totalGlobal) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--accent)',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            ))}
            {costPerBuilding.filter(b => b.total > 0).length === 0 && <p className="text-muted text-center">No hay gastos registrados en este periodo</p>}
          </div>
        </div>

        {/* Breakdown per Category */}
        <div className="card shadow-sm">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0 }}>Gasto por Categoría</h3>
            <ShoppingBag size={20} className="text-muted" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {costPerCategory.map((item: any) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)' }}></div>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{item.total.toLocaleString()} €</span>
              </div>
            ))}
            {costPerCategory.filter(c => c.total > 0).length === 0 && <p className="text-muted text-center">No hay categorías con gastos asignados</p>}
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <h3>Detalle Cruzado: Edificio vs Categoría</h3>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1.5rem' }}>Gastos detallados para el periodo seleccionado.</p>
        <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                {buildings.map((b: any) => <th key={b.id} style={{ textAlign: 'center' }}>{b.nombre}</th>)}
                <th style={{ textAlign: 'right' }}>Total Cat.</th>
              </tr>
            </thead>
            <tbody>
              {spareTypes.map((t: string) => {
                const catTotal = filteredItems.filter((i: any) => i.tipoRepuesto === t).reduce((sum: number, i: any) => sum + i.precioNeto, 0);
                if (catTotal === 0) return null;
                return (
                  <tr key={t}>
                    <td style={{ fontWeight: 700 }}>{t}</td>
                    {buildings.map((b: any) => {
                      const amount = filteredItems
                        .filter((i: any) => i.idEdificio === b.id && i.tipoRepuesto === t)
                        .reduce((sum: number, i: any) => sum + i.precioNeto, 0);
                      return (
                        <td key={b.id} style={{ textAlign: 'center', color: amount > 0 ? 'inherit' : 'var(--text-muted)' }}>
                          {amount > 0 ? `${amount.toLocaleString()} €` : '-'}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent)' }}>{catTotal.toLocaleString()} €</td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={buildings.length + 2} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay datos para mostrar con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- MODAL NUEVO PEDIDO MULTILÍNEA ---
function NewOrderModal({ suppliers, buildings, settings, onClose }: any) {
  const areaNum = settings?.numeroArea || '00';
  const [header, setHeader] = useState({
    idProveedor: 0,
    fechaPedido: new Date().toISOString().split('T')[0],
    fechaEntregaEstimada: '',
    observaciones: ''
  });

  const [items, setItems] = useState<any[]>([
    { idEdificio: 0, idInstalacion: 'otros', descripcion: '', unidades: 1, precioPVP: 0, descuento: 0, precioNeto: 0, idObra: undefined }
  ]);

  const receivedQuotations = useLiveQuery(() => 
    db.quotations.where('estado').anyOf('recibido', 'aceptado').toArray()
  ) || [];

  const [targetQuotationTotal, setTargetQuotationTotal] = useState<number | null>(null);

  const handleImportQuotation = (quotationId: number) => {
    const q = receivedQuotations.find(q => q.id === quotationId);
    if (!q) return;

    setTargetQuotationTotal(q.importeTotal);
    setHeader({
      ...header,
      idProveedor: q.idProveedor,
      fechaEntregaEstimada: q.fechaEntregaEstimada || '',
      observaciones: q.observaciones || ''
    });

    if (q.lineas && q.lineas.length > 0) {
      setItems(q.lineas.map((l) => ({
        idEdificio: 0,
        idInstalacion: 'otros',
        descripcion: l.descripcion,
        unidades: l.unidades,
        precioPVP: (q.lineas!.length === 1) ? q.importeTotal / l.unidades : 0,
        descuento: 0,
        precioNeto: (q.lineas!.length === 1) ? q.importeTotal : 0
      })));
    }
  };

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

    const currentYear = new Date().getFullYear();
    const orderId = await db.orders.add({
      ...header,
      numeroPedido: nextNum,
      anio: currentYear,
      estado: 'pendiente'
    } as Order);

    for (const item of items) {
      await db.orderItems.add({
        ...item,
        idPedido: orderId as number,
        estado: 'pendiente'
      } as OrderItem);
    }

    alert(`Pedido #${nextNum}/${areaNum}/${currentYear} generado con éxito.`);
    onClose(true);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '1100px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>Nuevo Pedido de Compra Multilínea</h2>
          <button className="btn" onClick={() => onClose(false)}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
          <div className="card shadow-sm" style={{ marginBottom: '1.5rem', background: 'var(--bg)', border: '1px solid var(--accent)' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ color: 'var(--accent)' }}>Importar desde Presupuesto (Opcional)</label>
              <select className="form-control" onChange={e => handleImportQuotation(Number(e.target.value))}>
                <option value="">-- Seleccionar presupuesto para auto-rellenar --</option>
                {receivedQuotations.map(q => {
                  const s = suppliers.find((s: any) => s.id === q.idProveedor);
                  return <option key={q.id} value={q.id}>Presupuesto #{q.id} - {s?.nombre} ({q.importeTotal}€)</option>
                })}
              </select>
            </div>
          </div>

          <div className="card shadow-sm" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group">
              <label>Proveedor</label>
              <select className="form-control" value={header.idProveedor} onChange={e => setHeader({...header, idProveedor: Number(e.target.value)})}>
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
              <input type="date" className="form-control" value={header.fechaEntregaEstimada} onChange={e => setHeader({...header, fechaEntregaEstimada: e.target.value})} />
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
                  <th style={{ padding: '0.8rem', textAlign: 'left', width: '140px' }}>EDIFICIO</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left', width: '140px' }}>CATEGORÍA</th>
                  <th style={{ padding: '0.8rem', textAlign: 'left' }}>DESCRIPCIÓN</th>
                  <th style={{ padding: '0.8rem', textAlign: 'center', width: '60px' }}>UDS</th>
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
                      <select className="form-control" style={{ fontSize: '0.8rem' }} value={item.idEdificio} onChange={e => updateItem(idx, 'idEdificio', Number(e.target.value))}>
                        <option value="0">Seleccionar...</option>
                        {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <select className="form-control" style={{ fontSize: '0.8rem' }} value={item.tipoRepuesto || ''} onChange={e => updateItem(idx, 'tipoRepuesto', e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {(settings?.tiposRepuesto || ['Climatización', 'Incendios', 'Electricidad', 'Alumbrado', 'Fontanería']).map((t: string) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
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
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            {targetQuotationTotal !== null && (
              <div style={{ padding: '0.5rem 1rem', background: 'var(--bg)', borderRadius: '8px', borderLeft: '4px solid var(--accent)' }}>
                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Total Presupuesto Objetivo</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{targetQuotationTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
              </div>
            )}
            <div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Total Neto del Pedido</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: items.reduce((sum, i) => sum + i.precioNeto, 0) === targetQuotationTotal ? 'var(--success)' : 'var(--accent)' }}>
                {items.reduce((sum, i) => sum + i.precioNeto, 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={() => onClose(false)}>Cancelar</button>
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

// --- MODAL DE PRESUPUESTO (NUEVO O EDICIÓN) ---
function QuotationModal({ suppliers, buildings, quotation, settings, onClose }: any) {
  const [data, setData] = useState({
    idProveedor: quotation?.idProveedor || 0,
    fechaSolicitud: quotation?.fechaSolicitud || new Date().toISOString().split('T')[0],
    fechaEntregaEstimada: quotation?.fechaEntregaEstimada || '',
    importeTotal: quotation?.importeTotal || 0,
    observaciones: quotation?.observaciones || '',
    estado: quotation?.estado || 'solicitado'
  });

  const [items, setItems] = useState<any[]>(
    quotation?.lineas || [{ descripcion: '', unidades: 1, idEdificio: 0, tipoRepuesto: '' }]
  );

  const spareTypes = settings?.tiposRepuesto || ['Climatización', 'Incendios', 'Electricidad', 'Alumbrado', 'Fontanería'];

  const addItem = () => {
    setItems([...items, { descripcion: '', unidades: 1, idEdificio: 0, tipoRepuesto: '' }]);
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
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!data.idProveedor) return alert('Selecciona un proveedor');
    
    const finalData = { ...data, lineas: items };

    if (quotation?.id) {
      await db.quotations.update(quotation.id, finalData);
    } else {
      await db.quotations.add(finalData as Quotation);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>{quotation ? 'Editar Presupuesto' : 'Solicitar Presupuesto'}</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Proveedor</label>
              <select className="form-control" value={data.idProveedor} onChange={e => setData({...data, idProveedor: Number(e.target.value)})}>
                <option value="">Seleccionar...</option>
                {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha de Solicitud</label>
              <input type="date" className="form-control" value={data.fechaSolicitud} onChange={e => setData({...data, fechaSolicitud: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Entrega Estimada</label>
              <input type="date" className="form-control" value={data.fechaEntregaEstimada} onChange={e => setData({...data, fechaEntregaEstimada: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
            <h3 style={{ margin: 0 }}>Líneas del Presupuesto</h3>
            <button className="btn btn-primary" onClick={addItem}><Plus size={16} /> Añadir Línea</button>
          </div>

          <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.8rem' }}>Descripción</th>
                  <th style={{ textAlign: 'left', padding: '0.8rem', width: '150px' }}>Edificio</th>
                  <th style={{ textAlign: 'left', padding: '0.8rem', width: '150px' }}>Categoría</th>
                  <th style={{ textAlign: 'center', padding: '0.8rem', width: '80px' }}>Uds</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <input className="form-control" value={item.descripcion} onChange={e => updateItem(idx, 'descripcion', e.target.value)} placeholder="Ej: Válvula de bola 1/2" />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <select className="form-control" value={item.idEdificio} onChange={e => updateItem(idx, 'idEdificio', Number(e.target.value))}>
                        <option value={0}>General / Otros</option>
                        {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <select className="form-control" value={item.tipoRepuesto || ''} onChange={e => updateItem(idx, 'tipoRepuesto', e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {spareTypes.map((t: string) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input type="number" className="form-control" style={{ textAlign: 'center' }} value={item.unidades} onChange={e => updateItem(idx, 'unidades', Number(e.target.value))} />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button className="btn text-error" onClick={() => removeItem(idx)} disabled={items.length === 1}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="form-group">
            <label>Notas / Observaciones</label>
            <textarea className="form-control" rows={2} value={data.observaciones} onChange={e => setData({...data, observaciones: e.target.value})} />
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>{quotation ? 'Guardar Cambios' : 'Guardar Solicitud'}</button>
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

// --- VISTA DE PROVEEDORES ---
function SuppliersView({ suppliers }: any) {
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="card" style={{ width: '100%', paddingLeft: '2.5rem' }} placeholder="Buscar proveedor..." />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={() => {
            const data = suppliers.map((s: any) => ({
              ID: s.id,
              Empresa: s.nombre,
              Email_Empresa: s.email,
              Telefono_Empresa: s.telefono,
              Total_Comerciales: s.comerciales?.length || 0,
              Comerciales_Info: s.comerciales?.map((c: any) => `${c.nombre} (${c.telefono} - ${c.email})`).join(' | ') || ''
            }));
            exportToExcel(data, 'Directorio_Proveedores');
          }}>
            <Download size={20} /> Exportar
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingSupplier(null); setShowModal(true); }}>
            <Plus size={20} /> Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <table>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ background: 'var(--bg)' }}>ID</th>
              <th style={{ background: 'var(--bg)' }}>Empresa</th>
              <th style={{ background: 'var(--bg)' }}>Email General</th>
              <th style={{ background: 'var(--bg)' }}>Teléfono General</th>
              <th style={{ background: 'var(--bg)' }}>Contactos Comerciales</th>
              <th style={{ background: 'var(--bg)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s: any) => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>#{s.id}</td>
                <td style={{ fontWeight: 700 }}>{s.nombre}</td>
                <td>
                  {s.email ? <a href={`mailto:${s.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'inherit', textDecoration: 'none' }}><Mail size={14} /> {s.email}</a> : <span className="text-muted">-</span>}
                </td>
                <td>
                  {s.telefono ? <a href={`tel:${s.telefono}`} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'inherit', textDecoration: 'none' }}><Phone size={14} /> {s.telefono}</a> : <span className="text-muted">-</span>}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {(s.comerciales || []).map((c: any, idx: number) => (
                      <div key={idx} style={{ fontSize: '0.85rem' }}>
                        <strong>{c.nombre}</strong>
                        {(c.telefono || c.email) && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            {' - '}
                            {c.telefono && <a href={`tel:${c.telefono}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{c.telefono}</a>}
                            {c.telefono && c.email && ' | '}
                            {c.email && <a href={`mailto:${c.email}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>{c.email}</a>}
                          </span>
                        )}
                      </div>
                    ))}
                    {(!s.comerciales || s.comerciales.length === 0) && (
                      <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Sin contactos</span>
                    )}
                  </div>
                </td>
                <td>
                  <button className="btn btn-primary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} onClick={() => { setEditingSupplier(s); setShowModal(true); }}>
                    <Edit size={14} style={{ marginRight: '0.3rem' }} /> Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SupplierModal 
          supplier={editingSupplier} 
          onClose={() => { setShowModal(false); setEditingSupplier(null); }} 
        />
      )}
    </>
  );
}

// --- MODAL DE PROVEEDOR ---
function SupplierModal({ supplier, onClose }: any) {
  const [data, setData] = useState({
    id: supplier?.id,
    nombre: supplier?.nombre || '',
    email: supplier?.email || '',
    telefono: supplier?.telefono || '',
    comerciales: supplier?.comerciales || []
  });

  const addComercial = () => {
    setData({
      ...data,
      comerciales: [...data.comerciales, { nombre: '', telefono: '', email: '' }]
    });
  };

  const updateComercial = (idx: number, field: string, value: string) => {
    const newComerciales = [...data.comerciales];
    newComerciales[idx] = { ...newComerciales[idx], [field]: value };
    setData({ ...data, comerciales: newComerciales });
  };

  const removeComercial = (idx: number) => {
    const newComerciales = [...data.comerciales];
    newComerciales.splice(idx, 1);
    setData({ ...data, comerciales: newComerciales });
  };

  const handleSave = async () => {
    if (!data.nombre) return alert('El nombre de la empresa es obligatorio');
    
    if (data.id) {
      await db.suppliers.update(data.id, data);
    } else {
      await db.suppliers.add(data);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2>{data.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div className="form-group">
            <label>Nombre de la Empresa *</label>
            <input className="form-control" value={data.nombre} onChange={e => setData({...data, nombre: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Teléfono (General)</label>
              <input className="form-control" value={data.telefono} onChange={e => setData({...data, telefono: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email (General/Pedidos)</label>
              <input type="email" className="form-control" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '1rem', borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Contactos Comerciales</h3>
              <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} onClick={addComercial}>
                <Plus size={16} /> Añadir Contacto
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {data.comerciales.map((c: any, idx: number) => (
                <div key={idx} style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', position: 'relative' }}>
                  <button 
                    className="btn text-error" 
                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.2rem' }} 
                    onClick={() => removeComercial(idx)}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem' }}>Nombre del Comercial</label>
                      <input className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={c.nombre} onChange={e => updateComercial(idx, 'nombre', e.target.value)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Móvil / Directo</label>
                        <input className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={c.telefono} onChange={e => updateComercial(idx, 'telefono', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Email Personal</label>
                        <input className="form-control" style={{ padding: '0.4rem', fontSize: '0.85rem' }} value={c.email} onChange={e => updateComercial(idx, 'email', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {data.comerciales.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  No hay comerciales registrados. Pulsa "Añadir Contacto" para empezar.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <button className="btn" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave}>Guardar Proveedor</button>
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

