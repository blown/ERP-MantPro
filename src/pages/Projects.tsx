import React, { useState } from 'react';
import { db, type Project } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  HardHat, 
  Plus, 
  FolderOpen, 
  FileText, 
  CheckSquare, 
  Clock, 
  Euro, 
  FileCheck,
  MoreVertical,
  ExternalLink
} from 'lucide-react';

export default function ProjectsPage() {
  const projects = useLiveQuery(() => db.projects.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [newProject, setNewProject] = useState<Partial<Project>>({
    estado: 'pendiente',
    beneficioCalculado: 0,
    documentos: []
  });

  const handleCreate = async () => {
    await db.projects.add(newProject as Project);
    setShowAdd(false);
    setNewProject({ estado: 'pendiente', beneficioCalculado: 0, documentos: [] });
  };

  const updateStatus = async (id: number, status: Project['estado']) => {
    await db.projects.update(id, { estado: status });
  };

  return (
    <div className="projects-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de grandes reparaciones, presupuestos al cliente y certificaciones.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={20} /> Nueva Obra
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {projects.map(project => {
          const building = buildings.find(b => b.id === project.idEdificio);
          return (
            <div key={project.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{project.nombreObra}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FolderOpen size={14} /> {building?.nombre || 'Obra General'}
                  </p>
                </div>
                <span className={`status-badge status-${project.estado}`}>
                  {project.estado.toUpperCase().replace('_', ' ')}
                </span>
              </div>

              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', fontSize: '0.875rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileCheck size={16} className="text-accent" /> Carpeta de Documentos
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Informe Word', 'Presupuesto', 'Adjudicación', 'Acta Recepción'].map(doc => (
                    <div key={doc} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: project.documentos.some(d => d.tipo === doc) ? 'var(--success)' : 'var(--text-muted)' }}>
                      <CheckSquare size={12} /> {doc}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', pt: '1rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Euro size={16} className="text-success" />
                  <span style={{ fontWeight: 700 }}>{project.beneficioCalculado.toLocaleString()} €</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Beneficio</span>
                </div>
                <button className="btn" style={{ padding: '0.4rem', background: 'var(--bg)' }} onClick={() => setSelectedProject(project)}>
                  <ExternalLink size={16} /> Abrir Carpeta
                </button>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', border: '2px dashed var(--border)', background: 'transparent' }}>
            <HardHat size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No hay obras activas</h3>
            <p style={{ color: 'var(--text-muted)' }}>Crea una obra cuando un repuesto supere la franquicia o cuando haya una reparación mayor.</p>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <h2>Nueva Obra / Reparación Mayor</h2>
              <button className="btn" onClick={() => setShowAdd(false)}>X</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Nombre de la Actuación</label>
                <input className="card" style={{ width: '100%', padding: '0.75rem' }} placeholder="Ej: Sustitución de Bombas de Calor"
                  onChange={e => setNewProject({...newProject, nombreObra: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Edificio</label>
                <select className="card" style={{ width: '100%', padding: '0.75rem' }}
                  onChange={e => setNewProject({...newProject, idEdificio: Number(e.target.value)})}>
                  <option value="">Seleccionar edificio...</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Beneficio Estimado (€)</label>
                <input type="number" className="card" style={{ width: '100%', padding: '0.75rem' }}
                  onChange={e => setNewProject({...newProject, beneficioCalculado: Number(e.target.value)})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button className="btn" onClick={() => setShowAdd(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleCreate}>Crear Carpeta de Obra</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
