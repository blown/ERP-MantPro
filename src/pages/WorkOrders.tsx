import { useState, useEffect } from 'react';
import { db, type WorkOrder } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  CheckCircle, 
  Package, 
  X, 
  Save, 
  ChevronRight,
  Trash2
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function WorkOrdersPage({ initialWorkOrderId, onClearWorkOrderId }: { initialWorkOrderId?: number | null, onClearWorkOrderId?: () => void }) {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'borrador' | 'cerrado'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const workOrders = useLiveQuery(() => {
    let collection = db.workOrders.orderBy('fecha').reverse();
    if (filterStatus !== 'todos') {
      return collection.filter(o => o.estado === filterStatus).toArray();
    }
    return collection.toArray();
  }, [filterStatus]);

  useEffect(() => {
    if (initialWorkOrderId && workOrders && workOrders.length > 0) {
      const order = workOrders.find(o => o.id === initialWorkOrderId);
      if (order) {
        setSelectedOrder(order);
        setShowEditor(true);
        if (onClearWorkOrderId) onClearWorkOrderId();
      }
    }
  }, [initialWorkOrderId, workOrders, onClearWorkOrderId]);

  const employees = useLiveQuery(() => db.employees.toArray()) || [];
  const vehicles = useLiveQuery(() => db.vehicles.toArray()) || [];

  const filteredOrders = (workOrders || []).filter(o => 
    o.numeroParte.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.descripcionGeneral.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="work-orders-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.8rem', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
                <Wrench size={24} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)' }}>Gestión y ejecución de partes de trabajo técnico.</p>
            </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setSelectedOrder(null); setShowEditor(true); }}>
          <Plus size={20} /> Nuevo Parte de Trabajo
        </button>
      </div>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Search size={20} className="text-muted" />
        <input 
          placeholder="Buscar por número o descripción..." 
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
            <Filter size={18} className="text-muted" />
            <select 
              className="btn" 
              style={{ background: 'var(--bg)', borderRadius: '8px' }}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borradores</option>
              <option value="cerrado">Cerrados</option>
            </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nº Parte</th>
              <th>Fecha</th>
              <th>Operario</th>
              <th>Vehículo</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => {
              const worker = employees.find(e => e.id === order.idOperario);
              const vehicle = vehicles.find(v => v.id === order.idVehiculo);
              return (
                <tr key={order.id}>
                  <td 
                    style={{ fontWeight: 700, color: 'var(--accent)', cursor: 'pointer' }}
                    onClick={() => { setSelectedOrder(order); setShowEditor(true); }}
                  >
                    {order.numeroParte}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{formatDate(order.fecha)}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {order.operatorIds?.map(id => {
                            const worker = employees.find(e => e.id === id);
                            return (
                                <div key={id} title={worker?.nombre} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
                                    {worker?.nombre[0]}{worker?.apellidos?.[0] || ''}
                                </div>
                            );
                        })}
                        {(!order.operatorIds || order.operatorIds.length === 0) && order.idOperario && (
                            <div title="Legacy Operator" style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 600 }}>
                                {employees.find(e => e.id === order.idOperario)?.nombre[0]}
                            </div>
                        )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{vehicle?.matricula || '-'}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                    {order.descripcionGeneral}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.estado}`}>
                      {order.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button 
                          className="btn" 
                          style={{ padding: '0.4rem', background: 'var(--bg)' }}
                          onClick={() => { setSelectedOrder(order); setShowEditor(true); }}
                        >
                          <ChevronRight size={18} />
                        </button>
                        <button 
                          className="btn text-error" 
                          style={{ padding: '0.4rem', background: 'rgba(239, 68, 68, 0.1)' }}
                          onClick={async () => {
                              if (confirm('¿Estás seguro de que deseas eliminar este parte de trabajo? Esta acción no se puede deshacer.')) {
                                  await db.workOrders.delete(order.id!);
                              }
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se han encontrado partes de trabajo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showEditor && (
        <WorkOrderEditor 
          order={selectedOrder} 
          onClose={() => setShowEditor(false)} 
        />
      )}
    </div>
  );
}

// Sub-component: Editor Modal
function WorkOrderEditor({ order, onClose }: { order: WorkOrder | null, onClose: () => void }) {
  const employees = useLiveQuery(() => db.employees.toArray()) || [];
  const vehicles = useLiveQuery(() => db.vehicles.toArray()) || [];
  const inventory = useLiveQuery(() => db.inventoryItems.where('estado').equals('ACTIVO').toArray()) || [];
  const orderItems = useLiveQuery(() => db.orderItems.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  
  const [formData, setFormData] = useState<Partial<WorkOrder>>(order || {
    numeroParte: `P-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'borrador',
    operatorIds: employees[0]?.id ? [employees[0].id] : [],
    assetIds: [],
    assetIdsGMAO: [],
    linkedOrderItemIds: [],
    descripcionGeneral: ''
  });

  const [assetSearch, setAssetSearch] = useState('');
  const [assetBuildingFilter, setAssetBuildingFilter] = useState('');

  const buildings = Array.from(new Set(inventory.map(i => i.edificio))).sort();

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.idEquipo.toLowerCase().includes(assetSearch.toLowerCase()) || 
                          item.descripcion.toLowerCase().includes(assetSearch.toLowerCase());
    const matchesBuilding = assetBuildingFilter === '' || item.edificio === assetBuildingFilter;
    return matchesSearch && matchesBuilding;
  });

  const [purchaseSearch, setPurchaseSearch] = useState('');
  const filteredPurchases = orderItems.filter(item => {
    const order = orders.find(o => o.id === item.idPedido);
    const supplier = suppliers.find(s => s.id === order?.idProveedor);
    const searchLower = purchaseSearch.toLowerCase();
    return item.descripcion.toLowerCase().includes(searchLower) || 
           order?.numeroPedido.toString().includes(searchLower) ||
           supplier?.nombre.toLowerCase().includes(searchLower);
  });


  const handleSave = async (cerrar: boolean = false) => {
    const finalData = {
      ...formData,
      estado: cerrar ? 'cerrado' : formData.estado,
      fechaCierre: cerrar ? new Date().toISOString() : formData.fechaCierre,
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString()
    } as WorkOrder;

    try {
      let workOrderId = finalData.id;
      if (finalData.id) {
        await db.workOrders.put(finalData);
      } else {
        workOrderId = await db.workOrders.add(finalData) as number;
      }

      if (cerrar) {
        if (finalData.idVehiculo && finalData.kmVehiculo) {
            await db.vehicles.update(finalData.idVehiculo, {
                kmsActuales: finalData.kmVehiculo,
                ultimaFechaKms: new Date().toISOString().split('T')[0]
            });
        }

        for (const assetId of finalData.assetIds) {
            const book = await db.maintenanceBooks.where('idEquipo').equals(assetId).first();
            if (book) {
                const newLog = {
                    fecha: new Date().toISOString(),
                    descripcion: `Intervención técnica: ${finalData.descripcionGeneral}`,
                    parteNo: finalData.numeroParte,
                    operario: finalData.operatorIds.map(id => employees.find(e => e.id === id)?.nombre).filter(Boolean).join(', ') || 'Desconocido'
                };

                const linkedItems = orderItems.filter(oi => finalData.linkedOrderItemIds.includes(oi.id!));
                const newSpares = linkedItems.map(item => {
                    const order = orders.find(o => o.id === item.idPedido);
                    const supplier = suppliers.find(s => s.id === order?.idProveedor);
                    return {
                        orderId: order?.id,
                        numeroPedido: order ? `${order.numeroPedido}/${order.anio}` : 'Manual',
                        workOrderId: workOrderId,
                        workOrderNo: finalData.numeroParte,
                        descripcion: item.descripcion,
                        fechaInstalacion: new Date().toISOString().split('T')[0],
                        unidades: item.unidades,
                        proveedorNombre: supplier?.nombre || 'Desconocido'
                    };
                });

                await db.maintenanceBooks.update(book.id!, {
                    manualData: {
                        ...book.manualData,
                        registrosPreventivos: [...book.manualData.registrosPreventivos, newLog],
                        repuestos: [...(book.manualData.repuestos || []), ...newSpares]
                    }
                });
            }
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el parte.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>{order ? 'Editar Parte de Trabajo' : 'Nuevo Parte de Trabajo'}</h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{formData.numeroParte}</div>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
                <label>Fecha</label>
                <input 
                    type="date" 
                    className="form-control" 
                    value={formData.fecha} 
                    onChange={e => setFormData({...formData, fecha: e.target.value})} 
                />
            </div>
            <div className="form-group">
                <label>Operarios Asignados</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'white', minHeight: '42px' }}>
                    {employees.map(e => (
                        <label key={e.id} style={{ 
                            padding: '0.3rem 0.6rem', 
                            background: formData.operatorIds?.includes(e.id!) ? 'var(--accent)' : 'var(--bg)',
                            color: formData.operatorIds?.includes(e.id!) ? 'white' : 'var(--text)',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            border: '1px solid var(--border)'
                        }}>
                            <input 
                                type="checkbox" 
                                style={{ display: 'none' }}
                                checked={formData.operatorIds?.includes(e.id!)}
                                onChange={() => {
                                    const current = formData.operatorIds || [];
                                    if (current.includes(e.id!)) {
                                        setFormData({...formData, operatorIds: current.filter(id => id !== e.id)});
                                    } else {
                                        setFormData({...formData, operatorIds: [...current, e.id!]});
                                    }
                                }}
                            />
                            {e.nombre}
                        </label>
                    ))}
                </div>
            </div>
            <div className="form-group">
                <label>Vehículo Utilizado</label>
                <select 
                    className="form-control"
                    value={formData.idVehiculo}
                    onChange={e => setFormData({...formData, idVehiculo: Number(e.target.value)})}
                >
                    <option value="">Ninguno</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.matricula} ({v.modelo})</option>)}
                </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
                <label>Descripción del Trabajo / Avería</label>
                <textarea 
                    className="form-control" 
                    style={{ height: '120px' }}
                    value={formData.descripcionGeneral}
                    onChange={e => setFormData({...formData, descripcionGeneral: e.target.value})}
                    placeholder="Describe los trabajos realizados, incidencias detectadas, etc."
                />
            </div>
            <div className="form-group">
                <label>Kilómetros Actuales Vehículo</label>
                <input 
                    type="number" 
                    className="form-control" 
                    value={formData.kmVehiculo || ''}
                    onChange={e => setFormData({...formData, kmVehiculo: Number(e.target.value)})}
                    placeholder="KM al finalizar"
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Se actualizará automáticamente la ficha de flota al cerrar.</p>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={18} /> Equipos / Instalaciones Afectadas
                </h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                        className="form-control" 
                        style={{ width: 'auto', padding: '0.4rem' }}
                        value={assetBuildingFilter}
                        onChange={e => setAssetBuildingFilter(e.target.value)}
                    >
                        <option value="">Todos los edificios</option>
                        {buildings.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input 
                            className="form-control" 
                            style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.85rem' }}
                            placeholder="Buscar equipo..."
                            value={assetSearch}
                            onChange={e => setAssetSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="table-container" style={{ maxHeight: '300px', overflowY: 'auto', background: 'white', borderRadius: '8px' }}>
                <table style={{ fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--bg)', zIndex: 1 }}>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>ID Equipo</th>
                            <th>Edificio</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.map(item => (
                            <tr 
                                key={item.id} 
                                style={{ cursor: 'pointer', background: formData.assetIds?.includes(item.idEquipo) ? 'rgba(37, 99, 235, 0.08)' : 'transparent' }}
                                onClick={() => {
                                    const current = formData.assetIds || [];
                                    if (current.includes(item.idEquipo)) {
                                        setFormData({...formData, assetIds: current.filter(id => id !== item.idEquipo)});
                                    } else {
                                        setFormData({...formData, assetIds: [...current, item.idEquipo]});
                                    }
                                }}
                            >
                                <td>
                                    <input 
                                        type="checkbox" 
                                        checked={formData.assetIds?.includes(item.idEquipo)}
                                        onChange={() => {}} // Handled by tr onClick
                                        style={{ pointerEvents: 'none' }}
                                    />
                                </td>
                                <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{item.idEquipo}</td>
                                <td>{item.edificio}</td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.descripcion}</td>
                            </tr>
                        ))}
                        {filteredInventory.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No se han encontrado equipos con los filtros aplicados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {formData.assetIds && formData.assetIds.length > 0 && (
                <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>
                    {formData.assetIds.length} equipos seleccionados para este parte.
                </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Search size={18} /> Compras / Repuestos Vinculados
                </h4>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        className="form-control" 
                        style={{ padding: '0.4rem 0.6rem 0.4rem 2rem', fontSize: '0.85rem', width: '250px' }}
                        placeholder="Buscar por pedido o repuesto..."
                        value={purchaseSearch}
                        onChange={e => setPurchaseSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--bg)', borderRadius: '8px' }}>
                <table style={{ fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: 'var(--border)', zIndex: 1 }}>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Pedido</th>
                            <th>Proveedor</th>
                            <th>Descripción / Repuesto</th>
                            <th style={{ textAlign: 'right' }}>Cant.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.map(item => {
                            const order = orders.find(o => o.id === item.idPedido);
                            const supplier = suppliers.find(s => s.id === order?.idProveedor);
                            return (
                                <tr 
                                    key={item.id} 
                                    style={{ cursor: 'pointer', background: formData.linkedOrderItemIds?.includes(item.id!) ? 'rgba(37, 99, 235, 0.08)' : 'transparent' }}
                                    onClick={() => {
                                        const current = formData.linkedOrderItemIds || [];
                                        if (current.includes(item.id!)) {
                                            setFormData({...formData, linkedOrderItemIds: current.filter(id => id !== item.id)});
                                        } else {
                                            setFormData({...formData, linkedOrderItemIds: [...current, item.id!]});
                                        }
                                    }}
                                >
                                    <td>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.linkedOrderItemIds?.includes(item.id!)}
                                            onChange={() => {}}
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    </td>
                                    <td style={{ fontWeight: 600 }}>#{order?.numeroPedido}</td>
                                    <td>{supplier?.nombre}</td>
                                    <td>{item.descripcion}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.unidades}</td>
                                </tr>
                            );
                        })}
                        {filteredPurchases.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No hay compras registradas para vincular.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <button className="btn text-error" onClick={onClose}>Cancelar</button>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={() => handleSave(false)}>
                <Save size={18} /> Guardar Borrador
            </button>
            <button className="btn btn-primary" onClick={() => handleSave(true)}>
                <CheckCircle size={18} /> Cerrar Parte y Sincronizar
            </button>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
        .text-error { color: var(--error) !important; }
      `}} />
    </div>
  );
}
