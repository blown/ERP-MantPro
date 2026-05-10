import { useState } from 'react';
import { db, type Project } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  HardHat, 
  Plus, 
  FolderOpen, 
  ExternalLink,
  Download,
  Filter,
  Edit,
  X,
  TrendingUp,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const exportToExcel = (data: any[], filename: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export default function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [filterPrep, setFilterPrep] = useState<'all' | 'preparar' | 'preparado'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pendiente' | 'en_proceso' | 'terminado'>('all');

  const filteredProjects = projects.filter(p => {
    const matchesPrep = filterPrep === 'all' || p.estadoPreparacion === filterPrep;
    const matchesStatus = filterStatus === 'all' || p.estado === filterStatus;
    return matchesPrep && matchesStatus;
  });

  const [newProject, setNewProject] = useState<Partial<Project>>({
    estado: 'pendiente',
    estadoPreparacion: 'preparar',
    porcentajeGanancia: 15,
    beneficioCalculado: 0,
    documentos: []
  });

  const handleCreate = async () => {
    await db.projects.add(newProject as Project);
    setShowAdd(false);
    setNewProject({ 
      estado: 'pendiente', 
      estadoPreparacion: 'preparar',
      porcentajeGanancia: 15,
      beneficioCalculado: 0, 
      documentos: [] 
    });
  };

  const togglePreparation = async (project: any) => {
    const newState = project.estadoPreparacion === 'preparar' ? 'preparado' : 'preparar';
    await db.projects.update(project.id, { estadoPreparacion: newState });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta obra? Esta acción no se puede deshacer.')) return;
    await db.projects.delete(id);
  };

  const exportAllCustomerExcel = () => {
    const data: any[] = [];
    filteredProjects.forEach(project => {
      const building = buildings.find(b => b.id === project.idEdificio);
      const markup = 1 + (project.porcentajeGanancia / 100);
      
      (project.items || []).forEach((item: any) => {
        data.push({
          Obra: project.nombreObra,
          Edificio: building?.nombre || 'General',
          Estado: project.estado.toUpperCase(),
          Descripcion: item.descripcion,
          Unidades: item.unidades,
          Precio_Venta_Unitario: (item.precioNeto * markup / item.unidades).toFixed(2) + ' €',
          Total_Venta: (item.precioNeto * markup).toFixed(2) + ' €'
        });
      });

      const totalVenta = (project.items || []).reduce((sum: number, i: any) => sum + (i.precioNeto * markup), 0);
      data.push({
        Obra: project.nombreObra,
        Descripcion: 'TOTAL OBRA',
        Total_Venta: totalVenta.toFixed(2) + ' €'
      });
      data.push({}); // Línea en blanco
    });

    exportToExcel(data, `Listado_Obras_Cliente`);
  };

  const exportAllInternalExcel = () => {
    const data: any[] = [];
    filteredProjects.forEach(project => {
      const building = buildings.find(b => b.id === project.idEdificio);
      const markup = 1 + (project.porcentajeGanancia / 100);
      
      (project.items || []).forEach((item: any) => {
        data.push({
          Obra: project.nombreObra,
          Edificio: building?.nombre || 'General',
          Estado: project.estado.toUpperCase(),
          Descripcion: item.descripcion,
          Unidades: item.unidades,
          Costo_Neto_Unitario: (item.precioNeto / item.unidades).toFixed(2) + ' €',
          Costo_Neto_Total: item.precioNeto.toFixed(2) + ' €',
          Margen: project.porcentajeGanancia + '%',
          Precio_Venta_Unitario: (item.precioNeto * markup / item.unidades).toFixed(2) + ' €',
          Total_Venta: (item.precioNeto * markup).toFixed(2) + ' €',
          Ganancia: (item.precioNeto * (project.porcentajeGanancia / 100)).toFixed(2) + ' €'
        });
      });

      const totalNeto = (project.items || []).reduce((sum: number, i: any) => sum + i.precioNeto, 0);
      const totalVenta = totalNeto * markup;
      data.push({
        Obra: project.nombreObra,
        Descripcion: 'TOTALES',
        Costo_Neto_Total: totalNeto.toFixed(2) + ' €',
        Total_Venta: totalVenta.toFixed(2) + ' €',
        Ganancia: (totalVenta - totalNeto).toFixed(2) + ' €'
      });
      data.push({}); // Línea en blanco
    });

    exportToExcel(data, `Detalle_Interno_Obras`);
  };

  return (
    <div className="projects-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Filter size={16} className="text-muted" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Preparación:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }} 
              value={filterPrep} onChange={e => setFilterPrep(e.target.value as any)}>
              <option value="all">Todas</option>
              <option value="preparar">Por Preparar</option>
              <option value="preparado">Preparadas</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Filter size={16} className="text-muted" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Estado:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 700 }} 
              value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
              <option value="all">Cualquier Estado</option>
              <option value="pendiente">Pte. Adjudicación</option>
              <option value="adjudicada">Adjudicada</option>
              <option value="terminada">Terminada</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn" style={{ background: 'var(--success)', color: 'white' }} onClick={exportAllCustomerExcel}>
            <Download size={18} /> Excel Cliente
          </button>
          <button className="btn" style={{ background: 'var(--accent)', color: 'white' }} onClick={exportAllInternalExcel}>
            <Download size={18} /> Excel Interno
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={20} /> Nueva Obra
          </button>
        </div>
      </div>

      <div className="table-container shadow-sm">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Nombre de la Obra</th>
              <th style={{ textAlign: 'left' }}>Edificio</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Preparación</th>
              <th style={{ textAlign: 'right' }}>Costo Neto</th>
              <th style={{ textAlign: 'right' }}>Venta (+Margen)</th>
              <th style={{ textAlign: 'right' }}>Beneficio</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map(project => {
              const building = buildings.find(b => b.id === project.idEdificio);
              const totalNeto = (project.items || []).reduce((sum: number, i: any) => sum + i.precioNeto, 0);
              const markup = 1 + (project.porcentajeGanancia / 100);
              const totalVenta = totalNeto * markup;
              const beneficio = totalVenta - totalNeto;

              return (
                <tr key={project.id}>
                  <td style={{ fontWeight: 700 }}>{project.nombreObra}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FolderOpen size={14} className="text-muted" />
                      {building?.nombre || 'General'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={`status-badge status-${project.estado}`}>
                      {project.estado === 'pendiente' ? 'PTE. CLIENTE' : project.estado.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn" 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '0.2rem 0.6rem', 
                        background: project.estadoPreparacion === 'preparado' ? 'var(--success)' : 'var(--error)',
                        color: 'white',
                        width: '100px'
                      }}
                      onClick={() => togglePreparation(project)}
                    >
                      {project.estadoPreparacion === 'preparado' ? 'PREPARADO' : 'PREPARAR'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{totalNeto.toLocaleString()} €</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                    {totalVenta.toLocaleString()} €
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                      +{project.porcentajeGanancia}%
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }}>
                    {beneficio.toLocaleString()} €
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="btn" style={{ padding: '0.4rem', background: 'var(--bg)' }} title="Editar Obra" onClick={() => setEditingProject(project)}>
                        <Edit size={16} />
                      </button>
                      <button className="btn" style={{ padding: '0.4rem', background: 'var(--bg)' }} title="Ver Documentación" onClick={() => setEditingProject(project)}>
                        <ExternalLink size={16} />
                      </button>
                      <button className="btn text-error" style={{ padding: '0.4rem', background: 'var(--bg)' }} title="Borrar Obra" onClick={() => handleDelete(project.id!)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {project.empresaAdjudicataria && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Adjudicada a: <strong>{project.empresaAdjudicataria}</strong>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredProjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <HardHat size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No se encontraron obras</h3>
            <p style={{ color: 'var(--text-muted)' }}>Ajusta los filtros o crea una nueva obra.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Nueva Obra / Reparación Mayor</h2>
              <button className="btn" onClick={() => setShowAdd(false)}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Nombre de la Actuación</label>
                <input className="form-control" placeholder="Ej: Sustitución de Bombas de Calor"
                  onChange={e => setNewProject({...newProject, nombreObra: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Edificio</label>
                <select className="form-control"
                  onChange={e => setNewProject({...newProject, idEdificio: Number(e.target.value)})}>
                  <option value="">Seleccionar edificio...</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Porcentaje de Ganancia (%)</label>
                <input type="number" className="form-control" defaultValue={15}
                  onChange={e => setNewProject({...newProject, porcentajeGanancia: Number(e.target.value)})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn" onClick={() => setShowAdd(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Carpeta de Obra</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingProject && (
        <ProjectDetailsModal 
          project={editingProject} 
          buildings={buildings}
          onClose={() => setEditingProject(null)} 
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .shadow-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); transition: all 0.3s ease; }
        .form-control { width: 100%; padding: 0.75rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
      `}} />
    </div>
  );
}

function ProjectDetailsModal({ project, buildings, onClose }: any) {
  const [data, setData] = useState({ ...project });
  const [activeTab, setActiveTab] = useState<'detalles' | 'documentos'>('detalles');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc = {
        tipo: file.type,
        nombre: file.name,
        ruta: base64
      };
      const updatedDocs = [...(data.documentos || []), newDoc];
      setData({ ...data, documentos: updatedDocs });
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (index: number) => {
    const updatedDocs = (data.documentos || []).filter((_: any, i: number) => i !== index);
    setData({ ...data, documentos: updatedDocs });
  };

  const handleSave = async () => {
    await db.projects.update(project.id, data);
    onClose();
  };

  const handleStatusChange = (newStatus: string) => {
    const newData = { ...data, estado: newStatus };
    const today = new Date().toISOString().split('T')[0];
    
    if (newStatus === 'adjudicada' && !data.fechaAdjudicacion) {
      newData.fechaAdjudicacion = today;
    } else if (newStatus === 'terminada' && !data.fechaTerminacion) {
      newData.fechaTerminacion = today;
    }
    
    setData(newData);
  };

  const totalNeto = (data.items || []).reduce((sum: number, i: any) => sum + i.precioNeto, 0);
  const totalVenta = totalNeto * (1 + (data.porcentajeGanancia / 100));

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>Obra: {project.nombreObra}</h2>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button 
            className={`btn ${activeTab === 'detalles' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('detalles')}
            style={{ padding: '0.5rem 1.5rem' }}
          >
            Detalles y Precios
          </button>
          <button 
            className={`btn ${activeTab === 'documentos' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('documentos')}
            style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FolderOpen size={18} /> Documentación ({(data.documentos || []).length})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '1rem' }}>
          {activeTab === 'detalles' ? (
            <>
          <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Nombre de la Obra</label>
              <input className="form-control" value={data.nombreObra} onChange={e => setData({...data, nombreObra: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Edificio</label>
              <select className="form-control" value={data.idEdificio} onChange={e => setData({...data, idEdificio: Number(e.target.value)})}>
                {buildings.map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
              </select>
            </div>
          </div>

          <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label>Estado de la Obra</label>
              <select className="form-control" value={data.estado} onChange={e => handleStatusChange(e.target.value)}>
                <option value="pendiente">Pte. Adjudicación Cliente</option>
                <option value="adjudicada">Adjudicada</option>
                <option value="terminada">Terminada</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha Adjudicación</label>
              <input type="date" className="form-control" value={data.fechaAdjudicacion || ''} onChange={e => setData({...data, fechaAdjudicacion: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Fecha Terminación</label>
              <input type="date" className="form-control" value={data.fechaTerminacion || ''} onChange={e => setData({...data, fechaTerminacion: e.target.value})} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Empresa Adjudicataria</label>
            <input 
              className="form-control" 
              placeholder="Ej: Nuestra Empresa o Competencia S.L."
              value={data.empresaAdjudicataria || ''} 
              onChange={e => setData({...data, empresaAdjudicataria: e.target.value})} 
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Indica quién realizará la obra (tú o un tercero).</p>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label>Descripción detallada para el cliente</label>
            <textarea className="form-control" rows={4} value={data.descripcion} onChange={e => setData({...data, descripcion: e.target.value})} />
          </div>

          <div style={{ background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Cálculo de Precios</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} className="text-success" />
                <label style={{ margin: 0 }}>Margen de Ganancia: </label>
                <input type="number" className="form-control" style={{ width: '80px', padding: '0.4rem' }} 
                  value={data.porcentajeGanancia} onChange={e => setData({...data, porcentajeGanancia: Number(e.target.value)})} />
                <strong>%</strong>
              </div>
            </div>

            <div className="table-container" style={{ background: 'white' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Componente</th>
                    <th style={{ textAlign: 'center' }}>Uds</th>
                    <th style={{ textAlign: 'right' }}>Costo Neto</th>
                    <th style={{ textAlign: 'right' }}>PVP Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.items || []).map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.6rem' }}>{item.descripcion}</td>
                      <td style={{ textAlign: 'center' }}>{item.unidades}</td>
                      <td style={{ textAlign: 'right' }}>{item.precioNeto.toLocaleString()} €</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                        {(item.precioNeto * (1 + (data.porcentajeGanancia / 100))).toLocaleString()} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo Total (Sin Ganancia)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{totalNeto.toLocaleString()} €</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Precio de Venta Final</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{totalVenta.toLocaleString()} €</div>
              </div>
          </div>
        </div>
      </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="card" style={{ background: 'var(--bg)', padding: '1.5rem', border: '2px dashed var(--border)', textAlign: 'center' }}>
                <FolderOpen size={32} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
                <h4>Añadir Documentos</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Sube planos, presupuestos externos, fotos o facturas de la obra.</p>
                <input 
                  type="file" 
                  id="project-doc-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                />
                <label htmlFor="project-doc-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
                  <Plus size={18} /> Seleccionar Archivo
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {(data.documentos || []).map((doc: any, i: number) => (
                  <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ padding: '0.5rem', background: 'var(--bg)', borderRadius: '8px' }}>
                        <FileText size={20} style={{ color: 'var(--accent)' }} />
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={doc.nombre}>
                          {doc.nombre}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.tipo || 'Archivo'}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                      <button 
                        className="btn" 
                        style={{ flex: 1, fontSize: '0.75rem', padding: '0.4rem', background: 'var(--bg)' }}
                        onClick={() => {
                          const win = window.open();
                          if (win) win.document.write(`<iframe src="${doc.ruta}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                        }}
                      >
                        <ExternalLink size={14} /> Ver
                      </button>
                      <button 
                        className="btn text-error" 
                        style={{ padding: '0.4rem', background: 'var(--bg)' }}
                        onClick={() => removeDoc(i)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {(data.documentos || []).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay documentos vinculados a esta obra.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave}>Guardar Cambios en Obra</button>
        </div>
      </div>
    </div>
  );
}
