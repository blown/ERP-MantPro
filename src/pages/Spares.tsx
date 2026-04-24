import React, { useState, useEffect } from 'react';
import { db, type Order, type Supplier, type Building } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ShoppingBag, Plus, Filter, Search, CheckCircle2, AlertCircle, FileText, ArrowRight } from 'lucide-react';

export default function SparesPage() {
  const [showNewOrder, setShowNewOrder] = useState(false);
  const orders = useLiveQuery(() => db.orders.orderBy('id').reverse().toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    estado: 'pendiente',
    anio: new Date().getFullYear(),
    esObra: false,
    unidades: 1,
    precioPVP: 0,
    descuento: 0,
    precioNeto: 0
  });

  // Auto-calc net price and "esObra" logic
  useEffect(() => {
    const net = (newOrder.precioPVP || 0) * (newOrder.unidades || 0) * (1 - (newOrder.descuento || 0) / 100);
    setNewOrder(prev => ({ 
      ...prev, 
      precioNeto: net,
      // Automatic decision based on franchise if not manually overridden later
      esObra: settings?.importeFranquicia ? net > settings.importeFranquicia : false
    }));
  }, [newOrder.precioPVP, newOrder.unidades, newOrder.descuento, settings?.importeFranquicia]);

  const handleSaveOrder = async () => {
    // Get last order number for the current year
    const lastOrder = await db.orders.where('anio').equals(new Date().getFullYear()).last();
    const nextNum = (lastOrder?.numeroPedido || 0) + 1;

    await db.orders.add({
      ...newOrder,
      numeroPedido: nextNum,
      fechaPedido: new Date().toISOString().split('T')[0],
    } as Order);

    setShowNewOrder(false);
    setNewOrder({ estado: 'pendiente', anio: new Date().getFullYear(), esObra: false, unidades: 1, precioPVP: 0, descuento: 0 });
  };

  return (
    <div className="spares-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de repuestos, albaranes y presupuestos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewOrder(true)}>
          <Plus size={20} /> Nuevo Pedido / Presupuesto
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Fecha</th>
              <th>Proveedor</th>
              <th>Descripción</th>
              <th>Importe Neto</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const supplier = suppliers.find(s => s.id === order.idProveedor);
              return (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600 }}>{order.numeroPedido}/{order.anio}</td>
                  <td style={{ fontSize: '0.875rem' }}>{order.fechaPedido}</td>
                  <td>{supplier?.nombre || 'N/A'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.descripcion}</td>
                  <td style={{ fontWeight: 700 }}>{order.precioNeto.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</td>
                  <td>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px',
                      background: order.esObra ? '#fee2e2' : '#f1f5f9',
                      color: order.esObra ? '#991b1b' : '#475569'
                    }}>
                      {order.esObra ? 'OBRA' : 'REPUESTO'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${order.state}`}>
                      {order.estado.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <button className="btn" style={{ padding: '0.25rem' }} title="Recibir Pedido">
                      <CheckCircle2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showNewOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2>Nuevo Pedido / Comparativa</h2>
              <button className="btn" onClick={() => setShowNewOrder(false)}>X</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Proveedor</label>
                <select 
                  className="card" style={{ width: '100%', padding: '0.5rem' }}
                  onChange={(e) => setNewOrder({...newOrder, idProveedor: Number(e.target.value)})}
                >
                  <option value="">Seleccionar Proveedor...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Edificio Destino</label>
                <select 
                  className="card" style={{ width: '100%', padding: '0.5rem' }}
                  onChange={(e) => setNewOrder({...newOrder, idEdificio: Number(e.target.value)})}
                >
                  <option value="">Seleccionar Edificio...</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Descripción del Componente</label>
                <input 
                  className="card" style={{ width: '100%', padding: '0.5rem' }}
                  value={newOrder.descripcion || ''}
                  onChange={(e) => setNewOrder({...newOrder, descripcion: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Instalación</label>
                <select 
                  className="card" style={{ width: '100%', padding: '0.5rem' }}
                  onChange={(e) => setNewOrder({...newOrder, idInstalacion: e.target.value})}
                >
                  <option value="">Seleccionar Tipo...</option>
                  <option value="alumbrado">Alumbrado</option>
                  <option value="climatizacion">Climatización</option>
                  <option value="incendios">Incendios</option>
                  <option value="fontaneria">Fontanería</option>
                  <option value="otros">Otros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Unidades</label>
                <input 
                  type="number" className="card" style={{ width: '100%', padding: '0.5rem' }}
                  value={newOrder.unidades}
                  onChange={(e) => setNewOrder({...newOrder, unidades: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Precio PVP Unitario (€)</label>
                <input 
                  type="number" className="card" style={{ width: '100%', padding: '0.5rem' }}
                  value={newOrder.precioPVP}
                  onChange={(e) => setNewOrder({...newOrder, precioPVP: Number(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Descuento (%)</label>
                <input 
                  type="number" className="card" style={{ width: '100%', padding: '0.5rem' }}
                  value={newOrder.descuento}
                  onChange={(e) => setNewOrder({...newOrder, descuento: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.5rem', background: 'var(--bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Neto Calculado</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{newOrder.precioNeto?.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Clasificación Sugerida: {newOrder.esObra ? 'OBRA' : 'REPUESTO'}</div>
                <button 
                  className="btn" 
                  style={{ 
                    background: newOrder.esObra ? '#fee2e2' : '#d1fae5', 
                    color: newOrder.esObra ? '#991b1b' : '#065f46',
                    fontSize: '0.75rem'
                  }}
                  onClick={() => setNewOrder({...newOrder, esObra: !newOrder.esObra})}
                >
                  Forzar {newOrder.esObra ? 'como Repuesto' : 'como Obra'}
                </button>
              </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowNewOrder(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSaveOrder}>Guardar y Generar Pedido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
