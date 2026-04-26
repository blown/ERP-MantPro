import { useState } from 'react';
import { db, type RegulatoryInspection } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Building2, 
  CheckCircle,
  ExternalLink,
  X,
  FileText,
  PlusCircle,
  Trash2,
  Edit3,
  Save,
  Phone,
  Mail,
  MapPin,
  Info,
  Notebook
} from 'lucide-react';
import OCALoader from '../components/Maintenance/OCALoader';

export default function RegulatoryInspectionsPage() {
  const [showImporter, setShowImporter] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<RegulatoryInspection | null>(null);
  const [editingInspection, setEditingInspection] = useState<RegulatoryInspection | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [activeTab, setActiveTab] = useState<'inspecciones' | 'directorio'>('inspecciones');
  const [highlightCompany, setHighlightCompany] = useState<string | null>(null);
  const [editingBuildingName, setEditingBuildingName] = useState<{ oldName: string, newName: string } | null>(null);
  const [deletingBuilding, setDeletingBuilding] = useState<string | null>(null);

  const inspections = useLiveQuery(() => db.regulatoryInspections.toArray()) || [];

  const filteredInspections = inspections.filter(i => 
    i.edificio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.instalacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.oca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by building
  const grouped = filteredInspections.reduce((acc: Record<string, RegulatoryInspection[]>, item) => {
    if (!acc[item.edificio]) acc[item.edificio] = [];
    acc[item.edificio].push(item);
    return acc;
  }, {});

  const getDaysRemaining = (nextDate: string) => {
    const next = new Date(nextDate);
    const today = new Date();
    const diff = next.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="oca-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ padding: '0.8rem', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
                <ShieldCheck size={24} />
            </div>
            <div>
                <p style={{ color: 'var(--text-muted)' }}>Control de Inspecciones Reglamentarias y Organismos de Control Autorizado (OCA).</p>
            </div>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="tabs" style={{ display: 'flex', background: 'var(--bg)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button 
                  className={`btn ${activeTab === 'inspecciones' ? 'btn-primary' : ''}`} 
                  onClick={() => setActiveTab('inspecciones')}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  Inspecciones
                </button>
                <button 
                  className={`btn ${activeTab === 'directorio' ? 'btn-primary' : ''}`} 
                  onClick={() => setActiveTab('directorio')}
                  style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                >
                  Directorio OCA
                </button>
            </div>
            <button className="btn" onClick={() => setShowImporter(true)}>
                <FileSpreadsheet size={18} /> Importar Excel
            </button>
            <button className="btn btn-primary" onClick={() => { setEditingInspection(null); setShowEditor(true); }}>
                <Plus size={18} /> Añadir Inspección
            </button>
        </div>
      </div>

      {activeTab === 'inspecciones' ? (
        <>

      <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Search size={20} className="text-muted" />
        <input 
          placeholder="Buscar por edificio, instalación u OCA..." 
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        {Object.entries(grouped).map(([building, items]) => (
          <div key={building} style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.8rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ padding: '0.5rem', background: 'var(--white)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                        <Building2 size={24} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        {editingBuildingName?.oldName === building ? (
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input 
                                    className="form-control" 
                                    style={{ fontSize: '1.25rem', fontWeight: 700, padding: '0.2rem 0.5rem', width: 'auto' }}
                                    value={editingBuildingName.newName}
                                    onChange={e => setEditingBuildingName({...editingBuildingName, newName: e.target.value})}
                                    autoFocus
                                />
                                <button 
                                    className="btn btn-primary" 
                                    style={{ padding: '0.3rem 0.8rem' }}
                                    onClick={async () => {
                                        const items = inspections.filter(i => i.edificio === building);
                                        for (const item of items) {
                                            await db.regulatoryInspections.update(item.id!, { edificio: editingBuildingName.newName });
                                        }
                                        setEditingBuildingName(null);
                                    }}
                                >
                                    Guardar
                                </button>
                                <button className="btn" onClick={() => setEditingBuildingName(null)}>Cancelar</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                <h2 
                                    style={{ margin: 0, fontSize: '1.5rem', cursor: 'pointer' }}
                                    onClick={() => setEditingBuildingName({ oldName: building, newName: building })}
                                    title="Haz clic para renombrar el edificio"
                                >
                                    {building}
                                </h2>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{items[0].descripcionEdificio}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {deletingBuilding === building ? (
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fee2e2', padding: '0.3rem 0.6rem', borderRadius: '8px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626' }}>¿Borrar todo?</span>
                            <button 
                                className="btn" 
                                style={{ background: '#dc2626', color: 'white', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                                onClick={async () => {
                                    const ids = items.map(i => i.id!);
                                    await db.regulatoryInspections.bulkDelete(ids);
                                    setDeletingBuilding(null);
                                }}
                            >
                                Sí, borrar
                            </button>
                            <button 
                                className="btn" 
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
                                onClick={() => setDeletingBuilding(null)}
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button 
                            className="btn" 
                            style={{ color: 'var(--error)', padding: '0.5rem' }}
                            title="Borrar todo el edificio"
                            onClick={() => setDeletingBuilding(building)}
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Instalación</th>
                            <th>Última Realizada</th>
                            <th>Próxima Inspección</th>
                            <th style={{ textAlign: 'center' }}>Días Restantes</th>
                            <th>OCA</th>
                            <th>Período</th>
                            <th style={{ textAlign: 'right' }}>Documentación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.sort((a, b) => getDaysRemaining(a.fechaProx) - getDaysRemaining(b.fechaProx)).map(item => {
                            const days = getDaysRemaining(item.fechaProx);
                            const isOverdue = days < 0;
                            const isSoon = days < 30;

                            return (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.instalacion}</td>
                                    <td>{new Date(item.fechaUltima).toLocaleDateString()}</td>
                                    <td>{new Date(item.fechaProx).toLocaleDateString()}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={{ 
                                            padding: '0.3rem 0.6rem', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem', 
                                            fontWeight: 700,
                                            background: isOverdue ? '#fee2e2' : (isSoon ? '#fef3c7' : 'var(--bg)'),
                                            color: isOverdue ? '#dc2626' : (isSoon ? '#d97706' : 'inherit')
                                        }}>
                                            {days}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn-link" 
                                            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 'inherit' }}
                                            onClick={() => {
                                                setHighlightCompany(item.oca);
                                                setActiveTab('directorio');
                                            }}
                                        >
                                            {item.oca}
                                        </button>
                                    </td>
                                    <td>{item.periodoAnios} años</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '0.4rem', background: 'var(--bg)' }}
                                                onClick={() => setSelectedInspection(item)}
                                                title="Certificados (PDF)"
                                            >
                                                <FileText size={18} />
                                            </button>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '0.4rem', background: 'var(--bg)' }}
                                                onClick={() => { setEditingInspection(item); setShowEditor(true); }}
                                                title="Editar"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                className="btn" 
                                                style={{ padding: '0.4rem', background: 'var(--bg)', color: 'var(--error)' }}
                                                onClick={() => {
                                                    if(confirm('¿Seguro que quieres borrar esta inspección?')) {
                                                        db.regulatoryInspections.delete(item.id!);
                                                    }
                                                }}
                                                title="Borrar"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg)', borderRadius: '12px', border: '2px dashed var(--border)' }}>
                <CheckCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>No hay inspecciones OCA registradas</h3>
                <p style={{ color: 'var(--text-muted)' }}>Utiliza el importador para cargar las inspecciones reglamentarias por edificio.</p>
            </div>
        )}
      </div>
      </>
      ) : (
        <InspectorDirectory highlight={highlightCompany} />
      )}

      {showImporter && (
        <OCALoader 
          onClose={() => setShowImporter(false)} 
          onComplete={() => setShowImporter(false)} 
        />
      )}

      {selectedInspection && (
          <DocumentModal 
            inspection={selectedInspection} 
            onClose={() => setSelectedInspection(null)} 
          />
      )}

      {showEditor && (
          <InspectionEditor 
            inspection={editingInspection}
            onClose={() => setShowEditor(false)}
          />
      )}
    </div>
  );
}

function InspectorDirectory({ highlight }: { highlight: string | null }) {
    const companies = useLiveQuery(() => db.inspectorCompanies.toArray()) || [];
    const [searchTerm, setSearchTerm] = useState(highlight || '');

    const [deletingCompanyId, setDeletingCompanyId] = useState<number | null>(null);

    const filtered = companies.filter(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleUpdate = async (id: number, field: string, value: string) => {
        await db.inspectorCompanies.update(id, { [field]: value });
    };

    return (
        <div className="directory-container">
            <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Search size={20} className="text-muted" />
                <input 
                    placeholder="Buscar empresa por nombre..." 
                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(company => (
                    <div key={company.id} className="card" style={{ 
                        border: highlight && company.nombre === highlight ? '2px solid var(--accent)' : '1px solid var(--border)',
                        boxShadow: highlight && company.nombre === highlight ? '0 0 15px rgba(2, 132, 199, 0.2)' : 'none',
                        background: 'var(--white)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%' }}>
                                <Notebook size={20} style={{ color: 'var(--accent)' }} />
                                <input 
                                    className="form-control" 
                                    style={{ fontWeight: 700, fontSize: '1.1rem', border: 'none', background: 'transparent', padding: '0.2rem' }}
                                    value={company.nombre} 
                                    onChange={e => handleUpdate(company.id!, 'nombre', e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {deletingCompanyId === company.id ? (
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                        <button 
                                            className="btn" 
                                            style={{ background: '#dc2626', color: 'white', padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                                            onClick={() => { db.inspectorCompanies.delete(company.id!); setDeletingCompanyId(null); }}
                                        >
                                            Borrar
                                        </button>
                                        <button 
                                            className="btn" 
                                            style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}
                                            onClick={() => setDeletingCompanyId(null)}
                                        >
                                            X
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        className="btn" 
                                        style={{ color: 'var(--error)', padding: '0.2rem' }}
                                        onClick={() => setDeletingCompanyId(company.id!)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Phone size={16} style={{ color: 'var(--text-muted)' }} />
                                <input 
                                    className="form-control" 
                                    placeholder="Teléfono" 
                                    value={company.telefono} 
                                    onChange={e => handleUpdate(company.id!, 'telefono', e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Mail size={16} style={{ color: 'var(--text-muted)' }} />
                                <input 
                                    className="form-control" 
                                    placeholder="Email" 
                                    value={company.email} 
                                    onChange={e => handleUpdate(company.id!, 'email', e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <MapPin size={16} style={{ color: 'var(--text-muted)' }} />
                                <input 
                                    className="form-control" 
                                    placeholder="Dirección" 
                                    value={company.direccion} 
                                    onChange={e => handleUpdate(company.id!, 'direccion', e.target.value)} 
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <Info size={16} style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }} />
                                <textarea 
                                    className="form-control" 
                                    placeholder="Notas o persona de contacto..." 
                                    style={{ height: '60px' }}
                                    value={company.notas} 
                                    onChange={e => handleUpdate(company.id!, 'notas', e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No se encontraron empresas OCA. Se añadirán automáticamente al importar un Excel.
                </div>
            )}
        </div>
    );
}

function InspectionEditor({ inspection, onClose }: { inspection: RegulatoryInspection | null; onClose: () => void }) {
    const [formData, setFormData] = useState<Partial<RegulatoryInspection>>(inspection || {
        edificio: '',
        descripcionEdificio: '',
        instalacion: '',
        fechaUltima: new Date().toISOString().split('T')[0],
        fechaProx: '',
        oca: '',
        periodoAnios: 0,
        observaciones: '',
        documentos: []
    });

    const handleSave = async () => {
        if (!formData.edificio || !formData.instalacion) {
            alert('Por favor, indica al menos el edificio y la instalación.');
            return;
        }

        try {
            if (inspection?.id) {
                await db.regulatoryInspections.update(inspection.id, formData);
            } else {
                await db.regulatoryInspections.add(formData as RegulatoryInspection);
            }
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar la inspección.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <h2>{inspection ? 'Editar Inspección' : 'Nueva Inspección OCA'}</h2>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Edificio (Nombre)</label>
                        <input className="form-control" value={formData.edificio} onChange={e => setFormData({...formData, edificio: e.target.value})} placeholder="P. ej. ASTURCÓN" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Descripción del Edificio / Ubicación</label>
                        <input className="form-control" value={formData.descripcionEdificio} onChange={e => setFormData({...formData, descripcionEdificio: e.target.value})} placeholder="Dirección completa..." />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Instalación / Equipo</label>
                        <input className="form-control" value={formData.instalacion} onChange={e => setFormData({...formData, instalacion: e.target.value})} placeholder="P. ej. Baja tensión, Ascensor..." />
                    </div>
                    <div className="form-group">
                        <label>Última Realizada</label>
                        <input type="date" className="form-control" value={formData.fechaUltima} onChange={e => setFormData({...formData, fechaUltima: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Próxima Inspección</label>
                        <input type="date" className="form-control" value={formData.fechaProx} onChange={e => setFormData({...formData, fechaProx: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Empresa OCA</label>
                        <input className="form-control" value={formData.oca} onChange={e => setFormData({...formData, oca: e.target.value})} placeholder="P. ej. EUROCONTROL" />
                    </div>
                    <div className="form-group">
                        <label>Período (Años)</label>
                        <input type="number" className="form-control" value={formData.periodoAnios} onChange={e => setFormData({...formData, periodoAnios: Number(e.target.value)})} />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Observaciones</label>
                        <textarea className="form-control" style={{ height: '80px' }} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
                    </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button className="btn" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        <Save size={18} /> Guardar Inspección
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
            `}} />
        </div>
    );
}

function DocumentModal({ inspection, onClose }: { inspection: RegulatoryInspection; onClose: () => void }) {
    const [docs, setDocs] = useState(inspection.documentos || []);
    const [newDoc, setNewDoc] = useState({ nombre: '', url: '' });

    const handleAdd = async () => {
        if (!newDoc.nombre || !newDoc.url) return;
        const updated = [...docs, newDoc];
        await db.regulatoryInspections.update(inspection.id!, { documentos: updated });
        setDocs(updated);
        setNewDoc({ nombre: '', url: '' });
    };

    const handleDelete = async (index: number) => {
        const updated = docs.filter((_, i) => i !== index);
        await db.regulatoryInspections.update(inspection.id!, { documentos: updated });
        setDocs(updated);
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0 }}>Certificados: {inspection.instalacion}</h3>
                    <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Sube enlaces a SharePoint, Google Drive o rutas locales de los certificados PDF.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {docs.map((doc, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'var(--bg)', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={18} style={{ color: 'var(--accent)' }} />
                                    <a href={doc.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', textDecoration: 'none' }}>
                                        {doc.nombre}
                                    </a>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn" onClick={() => window.open(doc.url, '_blank')}><ExternalLink size={14} /></button>
                                    <button className="btn" onClick={() => handleDelete(i)}><Trash2 size={14} style={{ color: 'var(--error)' }} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--bg)', padding: '1rem' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '0.8rem', fontSize: '0.85rem' }}>Vincular Nuevo Documento</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                            placeholder="Nombre (ej. Certificado 2024)" 
                            className="form-control"
                            value={newDoc.nombre}
                            onChange={e => setNewDoc({...newDoc, nombre: e.target.value})}
                        />
                        <input 
                            placeholder="URL o Ruta del archivo" 
                            className="form-control"
                            value={newDoc.url}
                            onChange={e => setNewDoc({...newDoc, url: e.target.value})}
                        />
                        <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleAdd}>
                            <PlusCircle size={18} /> Añadir Vínculo
                        </button>
                    </div>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
            `}} />
        </div>
    );
}
