import { useState } from 'react';
import { db, type InventoryItem } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Search, 
  Plus, 
  Upload, 
  MoreVertical, 
  History, 
  RefreshCw,
  ArrowLeftRight,
  BookOpen,
  Wrench,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import MaintenanceBookEditor from './MaintenanceBookEditor';
import SubstitutionWizard from './SubstitutionWizard';

interface Props {
  onImport: () => void;
  onCreateWorkOrder?: (assetId: string) => void;
}

export default function InventoryTable({ onImport, onCreateWorkOrder }: Props) {
  const inventory = useLiveQuery(() => db.inventoryItems.toArray()) || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [filterInstalacion, setFilterInstalacion] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showBookEditor, setShowBookEditor] = useState(false);
  const [showSubWizard, setShowSubWizard] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<number | null>(null);

  const handleDecommission = async (item: InventoryItem) => {
    if (confirm(`¿Estás seguro de que deseas dar de baja el equipo ${item.idEquipo}? Esta acción es irreversible.`)) {
      try {
        await db.inventoryItems.update(item.id!, { estado: 'BAJA' });
        
        // Log to Maintenance Book Historial
        let book = await db.maintenanceBooks.where('idEquipo').equals(item.idEquipo).first();
        if (book) {
          await db.maintenanceBookSyncLogs.add({
            maintenanceBookId: book.id!,
            fecha: new Date().toISOString(),
            accion: 'BAJA_EQUIPO',
            detalles: `El equipo ha sido dado de baja en el inventario.`
          });
        }

        setActionMenuId(null);
      } catch (err) {
        console.error(err);
        alert('Error al dar de baja el equipo.');
      }
    }
  };

  const handleReactivate = async (item: InventoryItem) => {
    if (confirm(`¿Deseas dar de alta nuevamente el equipo ${item.idEquipo}?`)) {
      try {
        await db.inventoryItems.update(item.id!, { estado: 'ACTIVO' });

        // Log to Maintenance Book Historial
        let book = await db.maintenanceBooks.where('idEquipo').equals(item.idEquipo).first();
        if (book) {
          await db.maintenanceBookSyncLogs.add({
            maintenanceBookId: book.id!,
            fecha: new Date().toISOString(),
            accion: 'ALTA_EQUIPO',
            detalles: `El equipo ha sido reactivado (dado de alta) nuevamente.`
          });
        }

        setActionMenuId(null);
      } catch (err) {
        console.error(err);
        alert('Error al dar de alta el equipo.');
      }
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }

    const data = filtered.map(item => ({
      'ID EQUIPO': item.idEquipo,
      'ESTADO': item.estado,
      'EDIFICIO': item.edificio,
      'INSTALACIÓN': item.tipoInstalacion,
      'DESCRIPCIÓN': item.descripcion,
      'LOCALIZACIÓN': item.localizacion,
      'UDS': item.numeroUnidades,
      'MEDIDA': item.tipoMedida,
      'FECHA ALTA': item.fechaAlta || '---',
      'OBSERVACIONES': item.observaciones || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario Técnico');

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, ...data.map(row => String(row[key as keyof typeof row]).length)) + 2
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Inventario_Tecnico_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filtered = inventory.filter(item => {
    const matchesSearch = item.idEquipo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBuilding = filterBuilding === 'all' || item.edificio === filterBuilding;
    const matchesInstalacion = filterInstalacion === 'all' || item.tipoInstalacion === filterInstalacion;
    return matchesSearch && matchesBuilding && matchesInstalacion;
  });

  const buildings = Array.from(new Set(inventory.map(i => i.edificio)));
  const instalacions = Array.from(new Set(inventory.map(i => i.tipoInstalacion)));

  return (
    <div className="inventory-list">
      <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            placeholder="Buscar por ID, descripción o localización..." 
            style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="btn" style={{ background: 'var(--bg)', borderRadius: '8px', padding: '0.6rem' }}
          value={filterBuilding}
          onChange={e => setFilterBuilding(e.target.value)}
        >
          <option value="all">Edificio: Todos</option>
          {buildings.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select 
          className="btn" style={{ background: 'var(--bg)', borderRadius: '8px', padding: '0.6rem' }}
          value={filterInstalacion}
          onChange={e => setFilterInstalacion(e.target.value)}
        >
          <option value="all">Instalación: Todas</option>
          {instalacions.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" onClick={handleExportExcel} style={{ background: '#16a34a', color: 'white', border: 'none' }}>
            <FileSpreadsheet size={18} /> Exportar Excel
          </button>
          <button className="btn btn-primary" onClick={onImport}>
            <Upload size={18} /> Importar Excel
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '1rem' }}>ID EQUIPO</th>
                <th style={{ padding: '1rem' }}>ESTADO</th>
                <th style={{ padding: '1rem' }}>EDIFICIO</th>
                <th style={{ padding: '1rem', width: '30%' }}>DESCRIPCIÓN</th>
                <th style={{ padding: '1rem' }}>UDS</th>
                <th style={{ padding: '1rem' }}>LIBRO</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: item.estado === 'BAJA' ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent)' }}>{item.idEquipo}</td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`status-badge status-${item.estado.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {item.estado}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{item.edificio}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{item.descripcion}</td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem' }}>{item.numeroUnidades} {item.tipoMedida}</td>
                  <td style={{ padding: '1rem' }}>
                    {item.libroMantenimientoUrl ? (
                      <button 
                        className="btn" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--accent)', color: 'white' }}
                        onClick={() => { setSelectedItem(item); setShowBookEditor(true); }}
                      >
                        <BookOpen size={12} /> Ver Libro
                      </button>
                    ) : (
                      <button 
                        className="btn" 
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--bg)' }}
                        onClick={() => { setSelectedItem(item); setShowBookEditor(true); }}
                      >
                        <Plus size={12} /> Crear Libro
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                    <button 
                      className="btn" 
                      style={{ padding: '0.4rem' }}
                      onClick={() => setActionMenuId(actionMenuId === item.id ? null : item.id!)}
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {actionMenuId === item.id && (
                      <div className="card shadow" style={{ position: 'absolute', right: '1rem', top: '3rem', zIndex: 100, minWidth: '180px', padding: '0.5rem', textAlign: 'left' }}>
                        <button 
                          className="btn-menu" 
                          onClick={() => { 
                            setSelectedItem(item); 
                            setShowSubWizard(true); 
                            setActionMenuId(null); 
                          }}
                          disabled={item.estado === 'BAJA'}
                        >
                          <ArrowLeftRight size={14} /> Sustituir Equipo
                        </button>
                        <button className="btn-menu" onClick={() => { setSelectedItem(item); setShowBookEditor(true); setActionMenuId(null); }}>
                          <RefreshCw size={14} /> Sincronizar Libro
                        </button>
                        <div style={{ borderTop: '1px solid var(--border)', margin: '0.4rem 0' }}></div>
                        <button 
                          className="btn-menu" 
                          onClick={() => { 
                            if (onCreateWorkOrder) onCreateWorkOrder(item.idEquipo);
                            setActionMenuId(null); 
                          }}
                          disabled={item.estado === 'BAJA'}
                        >
                          <Wrench size={14} /> Crear Parte de Trabajo
                        </button>
                        {item.estado === 'BAJA' ? (
                          <button 
                            className="btn-menu" 
                            style={{ color: '#16a34a' }}
                            onClick={() => handleReactivate(item)}
                          >
                            <History size={14} /> Dar de Alta
                          </button>
                        ) : (
                          <button 
                            className="btn-menu text-error" 
                            onClick={() => handleDecommission(item)}
                          >
                            <History size={14} /> Dar de Baja
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron equipos con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBookEditor && selectedItem && (
        <MaintenanceBookEditor 
          item={selectedItem} 
          onClose={() => { setShowBookEditor(false); setSelectedItem(null); setActionMenuId(null); }} 
        />
      )}

      {showSubWizard && selectedItem && (
        <SubstitutionWizard 
          item={selectedItem} 
          onClose={() => { setShowSubWizard(false); setSelectedItem(null); setActionMenuId(null); }} 
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .btn-menu {
          width: 100%;
          text-align: left;
          padding: 0.6rem 1rem;
          background: none;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          transition: background 0.2s;
        }
        .btn-menu:hover:not(:disabled) {
          background: var(--bg);
          color: var(--accent);
        }
        .btn-menu:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .text-error {
          color: var(--error) !important;
        }
      `}} />
    </div>
  );
}
