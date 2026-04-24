import React, { useState } from 'react';
import { db, type WorkOrder, type Employee, type Vehicle, type InventoryItem, type Asset } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  Clock, 
  CheckCircle, 
  User, 
  Truck, 
  Package, 
  X, 
  Save, 
  ChevronRight,
  Calendar as CalendarIcon,
  Trash2,
  FileText
} from 'lucide-react';

export default function WorkOrdersPage() {
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
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{order.numeroParte}</td>
                  <td style={{ fontSize: '0.85rem' }}>{new Date(order.fecha).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                            {worker?.nombre[0]}{worker?.apellidos[0]}
                        </div>
                        {worker?.nombre}
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
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem', background: 'var(--bg)' }}
                      onClick={() => { setSelectedOrder(order); setShowEditor(true); }}
                    >
                      <ChevronRight size={18} />
                    </button>
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
  
  const [formData, setFormData] = useState<Partial<WorkOrder>>(order || {
    numeroParte: `P-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'borrador',
    idOperario: employees[0]?.id,
    assetIds: [],
    assetIdsGMAO: [],
    descripcionGeneral: ''
  });

  const [materials, setMaterials] = useState<any[]>([]);

  const handleSave = async (cerrar: boolean = false) => {
    const finalData = {
      ...formData,
      estado: cerrar ? 'cerrado' : formData.estado,
      fechaCierre: cerrar ? new Date().toISOString() : formData.fechaCierre,
      updatedAt: new Date().toISOString(),
      createdAt: formData.createdAt || new Date().toISOString()
    } as WorkOrder;

    try {
      let orderId;
      if (finalData.id) {
        await db.workOrders.update(finalData.id, finalData);
        orderId = finalData.id;
      } else {
        orderId = await db.workOrders.add(finalData);
      }

      // If closing, trigger automations
      if (cerrar) {
        // 1. Update Vehicle KM
        if (finalData.idVehiculo && finalData.kmVehiculo) {
            await db.vehicles.update(finalData.idVehiculo, {
                kmsActuales: finalData.kmVehiculo,
                ultimaFechaKms: new Date().toISOString().split('T')[0]
            });
        }

        // 2. Update Maintenance Books for each asset
        for (const assetId of finalData.assetIds) {
            const book = await db.maintenanceBooks.where('idEquipo').equals(assetId).first();
            if (book) {
                const newLog = {
                    fecha: new Date().toISOString(),
                    descripcion: `Intervención técnica: ${finalData.descripcionGeneral}`,
                    parteNo: finalData.numeroParte,
                    operario: employees.find(e => e.id === finalData.idOperario)?.nombre || 'Desconocido'
                };
                await db.maintenanceBooks.update(book.id!, {
                    manualData: {
                        ...book.manualData,
                        registrosPreventivos: [...book.manualData.registrosPreventivos, newLog]
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
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', mt: '0.2rem' }}>{formData.numeroParte}</div>
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
                <label>Operario Responsable</label>
                <select 
                    className="form-control"
                    value={formData.idOperario}
                    onChange={e => setFormData({...formData, idOperario: Number(e.target.value)})}
                >
                    <option value="">Seleccionar...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellidos}</option>)}
                </select>
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
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', mt: '0.4rem' }}>Se actualizará automáticamente la ficha de flota al cerrar.</p>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--bg)', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: 0, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={18} /> Equipos / Instalaciones Afectadas
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {inventory.map(item => (
                    <label key={item.id} style={{ 
                        padding: '0.5rem 0.8rem', 
                        background: formData.assetIds?.includes(item.idEquipo) ? 'var(--accent)' : 'white',
                        color: formData.assetIds?.includes(item.idEquipo) ? 'white' : 'var(--text)',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        border: '1px solid var(--border)',
                        transition: 'all 0.2s'
                    }}>
                        <input 
                            type="checkbox" 
                            style={{ display: 'none' }}
                            checked={formData.assetIds?.includes(item.idEquipo)}
                            onChange={() => {
                                const current = formData.assetIds || [];
                                if (current.includes(item.idEquipo)) {
                                    setFormData({...formData, assetIds: current.filter(id => id !== item.idEquipo)});
                                } else {
                                    setFormData({...formData, assetIds: [...current, item.idEquipo]});
                                }
                            }}
                        />
                        {item.idEquipo}
                    </label>
                ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: 0, marginBottom: '1rem' }}>Materiales Empleados</h4>
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Próximamente: Vinculación con Compras y Gasto de Almacén.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: '2rem', pt: '1rem', borderTop: '1px solid var(--border)' }}>
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
