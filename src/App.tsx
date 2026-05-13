import { useState, useEffect } from 'react';
import { 
  Users, 
  Settings as SettingsIcon, 
  ShoppingCart, 
  Wrench, 
  ClipboardList, 
  Calendar, 
  LayoutDashboard,
  AlertCircle,
  Clock,
  LogOut,
  ChevronRight,
  TrendingUp,
  Package,
  Menu,
  X,
  Plus,
  Car,
  HardHat,
  BookOpen,
  Truck,
  ShieldCheck,
  FileSpreadsheet,
  Bell,
  ExternalLink,
  ShieldAlert,
  Printer,
  FileText
} from 'lucide-react';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { formatDate, getISOWeek } from './utils/dateUtils';

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
import TelegramInbox from './components/TelegramInbox';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showInventorySummary, setShowInventorySummary] = useState(false);
  const [sparesView, setSparesView] = useState<'orders' | 'quotations' | 'analytics' | 'suppliers'>('quotations');
  const [sparesOrderId, setSparesOrderId] = useState<number | null>(null);
  const [workOrderId, setWorkOrderId] = useState<number | null>(null);
  const [showTelegramInbox, setShowTelegramInbox] = useState(false);
  const [showSecurityNotices, setShowSecurityNotices] = useState(false);
  const pendingTelegramCount = useLiveQuery(async () => {
    try {
      if (!db.telegramInbox) return 0;
      const all = await db.telegramInbox.toArray();
      return all.filter(m => !m.processed).length;
    } catch (e) {
      console.error("Error en pendingTelegramCount:", e);
      return 0;
    }
  }) || 0;
  const settingsData = useLiveQuery(async () => {
    try {
      if (!db.settings) return null;
      return await db.settings.toCollection().first();
    } catch (e) {
      console.error("Error en settingsData:", e);
      return null;
    }
  });
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

  useEffect(() => {
    // Background sync for Telegram (every 30 seconds)
    const pollTelegram = async () => {
      try {
        const { syncTelegramUpdates } = await import('./utils/telegram');
        await syncTelegramUpdates();
      } catch (err) {
        console.error('Error polling Telegram:', err);
      }
    };

    pollTelegram(); // Initial sync
    const interval = setInterval(pollTelegram, 30000);
    return () => clearInterval(interval);
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
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <HardHat size={32} />
            <span>MantPro</span>
          </div>
          <X className="sidebar-close" onClick={() => setSidebarOpen(false)} />
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
                setSidebarOpen(false); // Close sidebar on mobile after clicking
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'var(--bg)', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <button 
            className="nav-item" 
            style={{ width: '100%', justifyContent: 'space-between', background: pendingTelegramCount > 0 ? 'rgba(0, 136, 204, 0.1)' : 'transparent' }}
            onClick={() => {
              setShowTelegramInbox(true);
              setSidebarOpen(false);
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Bell size={20} color={pendingTelegramCount > 0 ? '#0088cc' : 'currentColor'} />
              <span>Buzón Telegram</span>
            </div>
            {pendingTelegramCount > 0 && (
              <span style={{ background: '#0088cc', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                {pendingTelegramCount}
              </span>
            )}
          </button>
          
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Empresa Actual</div>
            <div style={{ fontWeight: 600 }}>{companyInfo.nombre}</div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <LayoutDashboard size={24} />
            </button>
            <div>
              <h1>{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p style={{ color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div 
              style={{ position: 'relative', cursor: 'pointer' }} 
              onClick={() => setShowTelegramInbox(true)}
              title="Buzón de Telegram"
            >
              <Bell size={24} style={{ color: pendingTelegramCount > 0 ? 'var(--accent)' : 'var(--text-muted)' }} />
              {pendingTelegramCount > 0 && (
                <span style={{ position: 'absolute', top: -4, right: -4, background: 'var(--error)', width: 8, height: 8, borderRadius: '50%' }}></span>
              )}
            </div>
            <button className="btn btn-primary">
              <Plus size={18} />
              <span>Acceso Rápido</span>
            </button>
          </div>
        </header>


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
        { activeTab === 'configuracion' && <SettingsPage />}
        
        
        {activeTab === 'dashboard' && (
          <DashboardView 
            onShowSummary={() => setShowInventorySummary(true)} 
            onNavigate={(tab) => setActiveTab(tab)}
            onViewOrders={(orderId?: number) => {
              setSparesView('orders');
              setSparesOrderId(orderId || null);
              setActiveTab('compras');
            }}
            onShowSecurity={() => setShowSecurityNotices(true)}
          />
        )}

        {showSecurityNotices && (
          <SecurityNoticesModal onClose={() => setShowSecurityNotices(false)} />
        )}

      </main>
      {showTelegramInbox && <TelegramInbox onClose={() => setShowTelegramInbox(false)} />}
      {showInventorySummary && (
        <InventorySummaryModal onClose={() => setShowInventorySummary(false)} />
      )}
    </div>
  );
}

// Componente para el Dashboard con datos reales
function DashboardView({ onShowSummary, onNavigate, onViewOrders, onShowSecurity }: { 
  onShowSummary: () => void,
  onNavigate: (tab: string) => void,
  onViewOrders: (orderId?: number) => void,
  onShowSecurity: () => void
}) {
  const pendingWorkOrders = useLiveQuery(async () => {
    try {
      if (!db.workOrders) return 0;
      return await db.workOrders.where('estado').equals('borrador').count();
    } catch (e) {
      console.error("Error en pendingWorkOrders:", e);
      return 0;
    }
  }) || 0;
  const activeProjects = useLiveQuery(async () => {
    try {
      if (!db.projects) return 0;
      return await db.projects.where('estado').notEqual('terminado').count();
    } catch (e) {
      console.error("Error en activeProjects:", e);
      return 0;
    }
  }) || 0;
  
  const criticalInspections = useLiveQuery(async () => {
    try {
      if (!db.regulatoryInspections) return 0;
      const inspections = await db.regulatoryInspections.toArray();
      return inspections.filter(i => {
        const days = Math.ceil((new Date(i.fechaProx).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        return days < 0;
      }).length;
    } catch (e) {
      console.error("Error en criticalInspections:", e);
      return 0;
    }
  }) || 0;

  const fleetAlerts = useLiveQuery(async () => {
    try {
      if (!db.vehicles) return 0;
      const vehicles = await db.vehicles.toArray();
      return vehicles.filter(v => {
        if (!v.proximaRevision) return false;
        const revisionDate = new Date(v.proximaRevision);
        const today = new Date();
        const diffInDays = (revisionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays <= 15;
      }).length;
    } catch (e) {
      console.error("Error en fleetAlerts:", e);
      return 0;
    }
  }) || 0;

  const activeSecurityNotices = useLiveQuery(async () => {
    try {
      if (!db.securityNotices) return 0;
      return await db.securityNotices.where('estado').equals('abierto').count();
    } catch (e) {
      console.error("Error en activeSecurityNotices:", e);
      return 0;
    }
  }) || 0;

  const orders = useLiveQuery(() => db.orders ? db.orders.orderBy('id').reverse().limit(5).toArray() : []) || [];
  const suppliers = useLiveQuery(() => db.suppliers ? db.suppliers.toArray() : []) || [];
  
  const settings = useLiveQuery(() => db.settings ? db.settings.toCollection().first() : null);
  const todayStr = new Date().toISOString().split('T')[0];
  const isProrrateoPending = settings?.fechaNotificacionProrrateo ? todayStr >= settings.fechaNotificacionProrrateo : false;
  const isRopaPending = settings?.fechaNotificacionRopa ? todayStr >= settings.fechaNotificacionRopa : false;
  const isGuardiaPending = settings?.fechaNotificacionGuardia ? todayStr >= settings.fechaNotificacionGuardia : false;
  const isIncendiosPending = settings?.fechaNotificacionIncendios ? todayStr >= settings.fechaNotificacionIncendios : false;

  const { year: currentYear, week: weekNo } = getISOWeek(new Date());

  const currentGuard = useLiveQuery(() => 
    db.guardiaWeeks ? db.guardiaWeeks.where('[anio+semana]').equals([currentYear, weekNo]).first() : null
  );

  const nextGuards = useLiveQuery(async () => {
    const guards = [];
    for (let i = 1; i <= 3; i++) {
      let w = weekNo + i;
      let y = currentYear;
      if (w > 52) { w = 1; y++; }
      if (!db.guardiaWeeks) break;
      const g = await db.guardiaWeeks.where('[anio+semana]').equals([y, w]).first();
      if (g) guards.push(g);
    }
    return guards;
  }) || [];

  const nextAbsences = useLiveQuery(async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Extiendo a 15 días para ver más periodos
    if (!db.vacationEntries) return [];
    const entries = await db.vacationEntries
      .where('fecha').between(todayStr, nextWeek, true, true)
      .and(e => e.tipo === 'V' || e.tipo === 'C')
      .toArray();

    // Group by person and type, then identify contiguous ranges
    const grouped: any[] = [];
    const personMap: { [key: string]: any[] } = {};

    entries.sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(e => {
      const key = `${e.operarioNombre}-${e.tipo}`;
      if (!personMap[key]) personMap[key] = [];
      personMap[key].push(e);
    });

    Object.values(personMap).forEach(personEntries => {
      if (personEntries.length === 0) return;
      
      let currentRange: any = null;
      personEntries.forEach(e => {
        const date = new Date(e.fecha);
        if (!currentRange) {
          currentRange = { ...e, startDate: e.fecha, endDate: e.fecha };
        } else {
          const prevDate = new Date(currentRange.endDate);
          const diffDays = (date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
          
          if (diffDays <= 1) { // Contiguous
            currentRange.endDate = e.fecha;
          } else {
            grouped.push(currentRange);
            currentRange = { ...e, startDate: e.fecha, endDate: e.fecha };
          }
        }
      });
      if (currentRange) grouped.push(currentRange);
    });

    return grouped.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }) || [];

  return (
    <>
      <div className="stats-grid">
        <div className="card" onClick={() => onNavigate('personal')} style={{ cursor: 'pointer', border: !currentGuard ? '1px dashed var(--warning)' : '1px solid var(--border)', position: 'relative' }}>
          {settings?.guardiaLink && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                window.open(settings.guardiaLink, '_blank');
              }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg)', border: '1px solid var(--border)', padding: '0.4rem', borderRadius: '8px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}
              title="Abrir Hoja Drive"
            >
              <ExternalLink size={14} /> Drive
            </button>
          )}
          <div className="card-title">Personal de Guardia</div>
          <div className="card-value">{currentGuard ? currentGuard.operarioNombre.toUpperCase() : 'NADIE'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.5rem' }}>
            {currentGuard ? `Semana ${weekNo} (${formatDate(currentGuard.fechaInicio)})` : 'Importa el Excel en Personal'}
          </div>
        </div>
        <div className="card" onClick={onShowSecurity} style={{ cursor: 'pointer', background: activeSecurityNotices > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--card-bg)', border: activeSecurityNotices > 0 ? '1px solid var(--warning)' : '1px solid var(--border)' }}>
          <div className="card-title" style={{ color: activeSecurityNotices > 0 ? '#b45309' : 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} /> Avisos Seguridad
          </div>
          <div className="card-value" style={{ color: activeSecurityNotices > 0 ? 'var(--warning)' : 'inherit' }}>{activeSecurityNotices}</div>
          <div style={{ fontSize: '0.75rem', color: activeSecurityNotices > 0 ? '#b45309' : 'var(--text-muted)', marginTop: '0.5rem' }}>Equipos averiados/bloqueados</div>
        </div>
        <div className="card" onClick={() => onNavigate('mantenimiento')} style={{ cursor: 'pointer' }}>
          <div className="card-title">Partes Pendientes</div>
          <div className="card-value">{pendingWorkOrders}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>Borradores por cerrar</div>
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
          <div style={{ fontSize: '0.75rem', color: (isProrrateoPending || isRopaPending || isGuardiaPending || isIncendiosPending) ? '#b91c1c' : 'var(--text-muted)', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                    {g.operarioNombre.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{g.operarioNombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Semana {g.semana} ({formatDate(g.fechaInicio)})</div>
                  </div>
                </div>
                </div>
              )) : (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No hay próximas guardias</div>
              )}
            </div>

            {/* Vacaciones / Compensatorios */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>Vacaciones / Comp. (Próximos 15 días)</div>
              {nextAbsences.length > 0 ? nextAbsences.map((a, idx) => (
                <div key={`a-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '8px', background: a.tipo === 'V' ? 'var(--success)' : 'var(--warning)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                      {a.tipo}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.operarioNombre}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {a.startDate === a.endDate ? a.startDate : `${a.startDate} al ${a.endDate}`}
                      </div>
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

        <div className="grid-2" style={{ gap: '1.5rem' }}>
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

// --- Nuevo Componente: Modal de Avisos de Seguridad ---
function SecurityNoticesModal({ onClose }: { onClose: () => void }) {
  const notices = useLiveQuery(() => db.securityNotices.orderBy('fecha').reverse().toArray()) || [];
  const [filterStatus, setFilterStatus] = useState<'todos' | 'abierto' | 'cerrado'>('todos');
  const [filterBuilding, setFilterBuilding] = useState<string>('todos');

  // Obtener lista única de edificios para el filtro
  const buildings = Array.from(new Set(notices.map(n => n.edificio).filter(Boolean))) as string[];

  const filteredNotices = notices.filter(notice => {
    const statusMatch = filterStatus === 'todos' || notice.estado === filterStatus;
    const buildingMatch = filterBuilding === 'todos' || notice.edificio === filterBuilding;
    return statusMatch && buildingMatch;
  });
  
  const handleCloseNotice = async (id: number) => {
    if (confirm('¿Deseas cerrar este aviso de seguridad?')) {
      await db.securityNotices.update(id, {
        estado: 'cerrado',
        fechaCierre: new Date().toISOString()
      });
    }
  };

  const handleExportPDF = (notice: any) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Aviso de Seguridad - ${notice.equipo}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { color: #f59e0b; font-size: 24px; font-weight: 800; margin: 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .label { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 600; margin-top: 4px; }
            .desc-box { background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; margin-top: 20px; min-height: 150px; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">AVISO DE SEGURIDAD</h1>
            <div style="text-align: right">
               <div class="label">Fecha Emisión</div>
               <div class="value">${new Date(notice.fecha).toLocaleString()}</div>
            </div>
          </div>

          <div class="info-grid">
            <div>
              <div class="label">Edificio / Ubicación</div>
              <div class="value">${notice.edificio}</div>
            </div>
            <div>
              <div class="label">Equipo / Activo</div>
              <div class="value">${notice.equipo}</div>
            </div>
            <div>
              <div class="label">Estado</div>
              <div class="value" style="color: ${notice.estado === 'abierto' ? '#b45309' : '#166534'}">${notice.estado.toUpperCase()}</div>
            </div>
            <div>
              <div class="label">ID Parte Trabajo</div>
              <div class="value">#${notice.workOrderId || 'N/A'}</div>
            </div>
          </div>

          <div class="label">Descripción detallada del aviso</div>
          <div class="desc-box">
            ${notice.descripcion}
          </div>

          <div class="footer">
            Documento generado por MantPro ERP - Servicio de Mantenimiento Técnico
          </div>
        </body>
      </html>
    `;

    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 500);
      }, 500);
    };
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ padding: '0.6rem', background: 'var(--warning)', borderRadius: '10px', color: 'white' }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0 }}>Avisos para Seguridad</h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Control de equipos averiados y avisos activos.</p>
            </div>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Filtrar por Estado</label>
            <select 
              value={filterStatus} 
              onChange={(e: any) => setFilterStatus(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            >
              <option value="todos">Todos los estados</option>
              <option value="abierto">Abiertos</option>
              <option value="cerrado">Cerrados</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Filtrar por Edificio</label>
            <select 
              value={filterBuilding} 
              onChange={(e: any) => setFilterBuilding(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
            >
              <option value="todos">Todos los edificios</option>
              {buildings.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Edificio</th>
                <th>Equipo</th>
                <th>Descripción / Aviso</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map(notice => (
                <tr key={notice.id} style={{ opacity: notice.estado === 'cerrado' ? 0.6 : 1 }}>
                  <td style={{ fontSize: '0.8rem' }}>{new Date(notice.fecha).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{notice.edificio}</td>
                  <td style={{ color: 'var(--accent)', fontWeight: 600 }}>{notice.equipo}</td>
                  <td style={{ fontSize: '0.85rem' }}>{notice.descripcion}</td>
                  <td>
                    <span className={`status-badge ${notice.estado === 'abierto' ? 'status-pendiente' : 'status-recibido'}`} style={{ background: notice.estado === 'abierto' ? 'var(--warning)' : 'var(--success)', color: 'white' }}>
                      {notice.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn" 
                        style={{ padding: '0.4rem', background: 'var(--bg)', border: '1px solid var(--border)' }} 
                        onClick={() => handleExportPDF(notice)}
                        title="Exportar PDF"
                      >
                        <Printer size={16} />
                      </button>
                      {notice.estado === 'abierto' ? (
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }} onClick={() => handleCloseNotice(notice.id!)}>
                          Cerrar Aviso
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cerrado: {new Date(notice.fechaCierre!).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {notices.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No hay avisos de seguridad registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button className="btn btn-primary" onClick={onClose}>Cerrar Ventana</button>
        </div>
      </div>
    </div>
  );
}

export default App;
