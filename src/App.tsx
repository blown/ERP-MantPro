import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  HardHat, 
  BookOpen, 
  Truck, 
  Calendar, 
  Settings as SettingsIcon,
  Bell,
  Plus,
  Wrench,
  ShieldCheck,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';

// Components
import SettingsPage from './pages/Settings';
import PersonalPage from './pages/Personal';
import SparesPage from './pages/Spares';
import ProjectsPage from './pages/Projects';
import MaintenancePage from './pages/Maintenance';
import VehiclesPage from './pages/Vehicles';
import AnnualTasksPage from './pages/AnnualTasks';
import CalendarView from './pages/Calendar';
import WorkOrdersPage from './pages/WorkOrders';
import RegulatoryInspectionsPage from './pages/RegulatoryInspections';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showInventorySummary, setShowInventorySummary] = useState(false);
  const [sparesView, setSparesView] = useState<'orders' | 'quotations' | 'analytics' | 'suppliers'>('quotations');
  const [sparesOrderId, setSparesOrderId] = useState<number | null>(null);
  const [workOrderId, setWorkOrderId] = useState<number | null>(null);
  const settingsData = useLiveQuery(() => db.settings.toCollection().first());
  const companyInfo = {
    nombre: settingsData?.nombreEmpresa || 'MantPro ERP',
    logo: settingsData?.logoEmpresa || ''
  };

  useEffect(() => {
    // Seed data for testing if empty
    const seedData = async () => {
      const supplierCount = await db.suppliers.count();
      if (supplierCount === 0) {
        await db.suppliers.add({
          nombre: "Suministros Industriales S.A.",
          telefono: "912345678",
          email: "ventas@suministros.com",
          comerciales: [
            {
              nombre: "Carlos Gomez",
              telefono: "600123456",
              email: "carlos.gomez@suministros.com"
            }
          ]
        });
      }
      const buildingCount = await db.buildings.count();
      if (buildingCount === 0) {
        await db.buildings.add({ nombre: "Edificio Central" });
      }
    };
    seedData();
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      const { tab, view, orderId, workOrderId } = e.detail;
      if (tab) setActiveTab(tab);
      if (view) setSparesView(view);
      if (orderId !== undefined) setSparesOrderId(orderId);
      if (workOrderId !== undefined) setWorkOrderId(workOrderId);
    };
    window.addEventListener('erp-navigate', handleNavigate);
    return () => window.removeEventListener('erp-navigate', handleNavigate);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Panel de control', icon: LayoutDashboard },
    { id: 'personal', label: 'Personal', icon: Users },
    { id: 'compras', label: 'Compras', icon: ShoppingCart },
    { id: 'obras', label: 'Obras', icon: HardHat },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: BookOpen },
    { id: 'vehiculos', label: 'Vehículos', icon: Truck },
    { id: 'tareas_anuales', label: 'Tareas Anuales', icon: Calendar },
    { id: 'inspecciones_oca', label: 'Inspecciones OCA', icon: ShieldCheck },
    { id: 'configuracion', label: 'Configuración', icon: SettingsIcon },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo">
          <HardHat size={32} />
          <span>MantPro</span>
        </div>
        
        <nav className="nav-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'compras') {
                  setSparesView('quotations');
                  setSparesOrderId(null);
                }
                setActiveTab(item.id);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empresa Actual</div>
          <div style={{ fontWeight: 600 }}>{companyInfo.nombre}</div>
        </div>
      </aside>

      <main className="main-content">
        <header>
          <div>
            <h1>{navItems.find(n => n.id === activeTab)?.label}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Bell size={24} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} />
              <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--error)', width: 8, height: 8, borderRadius: '50%' }}></span>
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              <span>Acceso Rápido</span>
            </button>
          </div>
        </header>

        {activeTab === 'configuracion' && <SettingsPage />}
        {activeTab === 'personal' && (
          <PersonalPage 
            onNavigateToRopa={() => {
              setActiveTab('tareas_anuales');
            }} 
          />
        )}
        {activeTab === 'compras' && (
          <SparesPage 
            initialView={sparesView} 
            initialOrderId={sparesOrderId} 
            onClearOrderId={() => setSparesOrderId(null)} 
          />
        )}
        {activeTab === 'obras' && <ProjectsPage />}
        {activeTab === 'mantenimiento' && (
          <MaintenancePage 
            initialWorkOrderId={workOrderId} 
            onClearWorkOrderId={() => setWorkOrderId(null)} 
          />
        )}
        { activeTab === 'vehiculos' && <VehiclesPage onNavigateToPartes={() => setActiveTab('mantenimiento')} />}
        { activeTab === 'tareas_anuales' && <AnnualTasksPage />}
        { activeTab === 'calendario' && <CalendarView />}
        { activeTab === 'inspecciones_oca' && <RegulatoryInspectionsPage />}
        
        {activeTab === 'dashboard' && (
          <DashboardView 
            onShowSummary={() => setShowInventorySummary(true)} 
            onNavigate={(tab) => setActiveTab(tab)}
            onViewOrders={(orderId?: number) => {
              setSparesView('orders');
              setSparesOrderId(orderId || null);
              setActiveTab('compras');
            }}
          />
        )}

        {showInventorySummary && (
          <InventorySummaryModal onClose={() => setShowInventorySummary(false)} />
        )}
      </main>
    </div>
  );
}

// Componente para el Dashboard con datos reales
function DashboardView({ onShowSummary, onNavigate, onViewOrders }: { 
  onShowSummary: () => void,
  onNavigate: (tab: string) => void,
  onViewOrders: (orderId?: number) => void
}) {
  const pendingOrders = useLiveQuery(() => db.orders.where('estado').equals('pendiente').count()) || 0;
  const activeProjects = useLiveQuery(() => db.projects.where('estado').notEqual('terminado').count()) || 0;
  const criticalInspections = useLiveQuery(() => db.regulatoryInspections.toArray().then(inspections => 
    inspections.filter(i => {
      const days = Math.ceil((new Date(i.fechaProx).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return days < 0;
    }).length
  )) || 0;

  const fleetAlerts = useLiveQuery(() => db.vehicles.toArray().then(vehicles => 
    vehicles.filter(v => {
      if (!v.proximaRevision) return false;
      const revisionDate = new Date(v.proximaRevision);
      const today = new Date();
      const diffInDays = (revisionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffInDays <= 15; // Warn if revision is in less than 15 days or overdue
    }).length
  )) || 0;

  const orders = useLiveQuery(() => db.orders.orderBy('id').reverse().limit(5).toArray()) || [];
  const suppliers = useLiveQuery(() => db.suppliers.toArray()) || [];
  
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const todayStr = new Date().toISOString().split('T')[0];
  const isProrrateoPending = settings?.fechaNotificacionProrrateo ? todayStr >= settings.fechaNotificacionProrrateo : false;
  const isRopaPending = settings?.fechaNotificacionRopa ? todayStr >= settings.fechaNotificacionRopa : false;
  const isGuardiaPending = settings?.fechaNotificacionGuardia ? todayStr >= settings.fechaNotificacionGuardia : false;
  const isIncendiosPending = settings?.fechaNotificacionIncendios ? todayStr >= settings.fechaNotificacionIncendios : false;

  // Get current ISO week
  const today = new Date();
  const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const currentYear = d.getUTCFullYear();

  const currentGuard = useLiveQuery(() => 
    db.guardiaWeeks.where('[anio+semana]').equals([currentYear, weekNo]).first()
  );

  const nextGuards = useLiveQuery(async () => {
    const guards = [];
    for (let i = 1; i <= 3; i++) {
      let w = weekNo + i;
      let y = currentYear;
      if (w > 52) { w = 1; y++; }
      const g = await db.guardiaWeeks.where('[anio+semana]').equals([y, w]).first();
      if (g) guards.push(g);
    }
    return guards;
  }) || [];

  const nextAbsences = useLiveQuery(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return await db.vacationEntries
      .where('fecha').between(todayStr, nextWeek, true, true)
      .and(e => e.tipo === 'V' || e.tipo === 'C')
      .toArray();
  }) || [];

  return (
    <>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <div className="card" onClick={() => onNavigate('personal')} style={{ cursor: 'pointer', border: !currentGuard ? '1px dashed var(--warning)' : '1px solid var(--border)' }}>
          <div className="card-title">Personal de Guardia</div>
          <div className="card-value" style={{ fontSize: currentGuard ? '1.5rem' : '2rem' }}>
            {currentGuard ? currentGuard.operarioNombre : 'Sin Cargar'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {currentGuard ? `Semana ${weekNo} (${currentGuard.fechaInicio})` : 'Importa el Excel en Personal'}
          </div>
        </div>
        <div className="card" onClick={() => onViewOrders()} style={{ cursor: 'pointer' }}>
          <div className="card-title">Pedidos Pendientes</div>
          <div className="card-value">{pendingOrders}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>Total en curso</div>
        </div>
        <div className="card" onClick={() => onNavigate('obras')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Obras Activas</div>
          <div className="card-value">{activeProjects}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>Trabajos en proceso</div>
        </div>
        <div className="card" onClick={() => onNavigate('inspecciones_oca')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Revisiones Críticas</div>
          <div className="card-value overdue">{criticalInspections}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--error)', marginTop: '0.5rem' }}>Inspecciones OCA vencidas</div>
        </div>
        <div className="card" onClick={() => onNavigate('vehiculos')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Alertas de Flota</div>
          <div className="card-value" style={{ color: fleetAlerts > 0 ? 'var(--error)' : 'inherit' }}>{fleetAlerts}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Flota &lt; 15 días</div>
        </div>
        <div className="card" onClick={() => onNavigate('tareas_anuales')} style={{ cursor: 'pointer', background: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#fee2e2' : 'var(--card-bg)', color: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#991b1b' : 'inherit', border: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '2px solid #ef4444' : '1px solid var(--border)' }}>
          <div className="card-title" style={{ color: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#991b1b' : 'var(--text-muted)' }}>Tareas Anuales</div>
          <div className="card-value" style={{ color: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#ef4444' : 'inherit' }}>
            {(isProrrateoPending ? 1 : 0) + (isRopaPending ? 1 : 0) + (isGuardiaPending ? 1 : 0) + (isIncendiosPending ? 1 : 0)}/4
          </div>
          <div style={{ fontSize: '0.75rem', color: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#b91c1c' : 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>Prorrateo | Ropa | Guardia | Incendios</span>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <button 
          className="card" 
          onClick={onShowSummary}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', cursor: 'pointer', border: '1px solid var(--accent)', background: 'linear-gradient(45deg, var(--bg), rgba(2, 132, 199, 0.05))' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
              <FileSpreadsheet size={24} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Resumen Automático de Inventario Técnico</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cifras clave, estado de libros y trazabilidad por edificio</div>
            </div>
          </div>
          <div className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Ver Estadísticas</div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2>Pedidos Recientes</h2>
            <button className="btn" onClick={() => onViewOrders()} style={{ padding: '0.25rem 0.5rem', background: 'var(--bg)' }}>Ver todos</button>
          </div>
          <div className="table-container" style={{ flex: 1, overflowY: 'auto', marginTop: '0.5rem', border: 'none' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--card-bg)' }}>
                <tr>
                  <th>Pedido</th>
                  <th>Proveedor</th>
                  <th>Observaciones</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => {
                  const supplier = suppliers.find(s => s.id === order.idProveedor);
                  return (
                    <tr key={order.id}>
                      <td>#{order.numeroPedido}-{order.anio}</td>
                      <td>{supplier?.nombre || 'Pedido...'}</td>
                      <td>{order.observaciones || 'Pedido General'}</td>
                      <td><span className={`status-badge status-${order.estado}`}>{order.estado.toUpperCase()}</span></td>
                      <td><button className="btn" onClick={() => onViewOrders(order.id)} style={{ fontSize: '0.8rem', padding: '0.2rem 0.4rem' }}>Detalles</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ height: '400px', overflowY: 'auto' }}>
          <h2>Disponibilidad Personal</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Guardias */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Próximas Guardias</div>
              {nextGuards.length > 0 ? nextGuards.map((g, idx) => (
                <div key={`g-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                      {g.operarioNombre[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.operarioNombre}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Semana {g.semana} ({g.fechaInicio})</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay próximas guardias</div>
              )}
            </div>

            {/* Vacaciones / Compensatorios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Vacaciones / Comp. (7 días)</div>
              {nextAbsences.length > 0 ? nextAbsences.map((a, idx) => (
                <div key={`a-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: a.tipo === 'V' ? 'var(--success)' : 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                      {a.tipo}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.operarioNombre}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{a.fecha}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nadie de vacaciones próximamente</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Nuevo Componente: Modal de Resumen de Inventario ---
function InventorySummaryModal({ onClose }: { onClose: () => void }) {
  const inventory = useLiveQuery(() => db.inventoryItems.toArray()) || [];
  
  const stats = {
    total: inventory.length,
    activos: inventory.filter(i => i.estado === 'ACTIVO').length,
    bajas: inventory.filter(i => i.estado === 'BAJA').length,
    conLibro: inventory.filter(i => i.libroMantenimientoUrl && i.libroMantenimientoUrl !== '').length,
    sinLibro: inventory.filter(i => !i.libroMantenimientoUrl || i.libroMantenimientoUrl === '').length
  };

  const perBuilding = inventory.reduce((acc: any, item) => {
    acc[item.edificio] = (acc[item.edificio] || 0) + 1;
    return acc;
  }, {});

  const perType = inventory.reduce((acc: any, item) => {
    acc[item.tipoInstalacion] = (acc[item.tipoInstalacion] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2>Resumen de Inventario Técnico</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <div className="card-title">Equipos Totales</div>
            <div className="card-value">{stats.total}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <div className="card-title">Activos</div>
            <div className="card-value" style={{ color: 'var(--success)' }}>{stats.activos}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <div className="card-title">Con Libro</div>
            <div className="card-value" style={{ color: 'var(--accent)' }}>{stats.conLibro}</div>
          </div>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <div className="card-title">% Cobertura</div>
            <div className="card-value">{stats.total > 0 ? Math.round((stats.conLibro / stats.total) * 100) : 0}%</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Por Edificio</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {Object.entries(perBuilding).map(([name, count]: any) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 700 }}>{count} ud</span>
                </div>
              ))}
              {Object.keys(perBuilding).length === 0 && <p className="text-muted">No hay datos</p>}
            </div>
          </div>
          <div className="card" style={{ background: 'var(--bg)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Por Tipo de Instalación</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {Object.entries(perType).map(([name, count]: any) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 700 }}>{count} ud</span>
                </div>
              ))}
              {Object.keys(perType).length === 0 && <p className="text-muted">No hay datos</p>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>Cerrar Resumen</button>
        </div>
      </div>
    </div>
  );
}

export default App;
