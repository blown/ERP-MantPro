import { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  BookOpen, 
  Search, 
  MapPin, 
  AlertTriangle, 
  History, 
  Image as ImageIcon, 
  FileText,
  Plus,
  Database,
  ClipboardList,
  Wrench
} from 'lucide-react';
import { differenceInYears } from 'date-fns';
import InventoryTable from '../components/Inventory/InventoryTable';
import InventoryImporter from '../components/Inventory/InventoryImporter';

interface Props {
  onNavigateToPartes?: (assetId?: string) => void;
}

export default function MaintenancePage({ onNavigateToPartes }: Props) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'gmao'>('inventory');
  const [showImporter, setShowImporter] = useState(false);
  const assets = useLiveQuery(() => db.assets.toArray()) || [];
  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const [filterBuilding, setFilterBuilding] = useState<number | string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesBuilding = filterBuilding === 'all' || asset.idEdificio === Number(filterBuilding);
    const matchesSearch = asset.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          asset.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBuilding && matchesSearch;
  });

  return (
    <div className="maintenance-container">
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '2rem' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ 
            padding: '1rem 0.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'inventory' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'inventory' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: activeTab === 'inventory' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Database size={18} /> Inventario Técnico
        </button>
        <button 
          onClick={() => setActiveTab('gmao')}
          style={{ 
            padding: '1rem 0.5rem', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'gmao' ? '3px solid var(--accent)' : '3px solid transparent',
            color: activeTab === 'gmao' ? 'var(--text)' : 'var(--text-muted)',
            fontWeight: activeTab === 'gmao' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <ClipboardList size={18} /> Activos GMAO
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <InventoryTable onImport={() => setShowImporter(true)} />
      ) : (
        <>
          <div className="card" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Search size={20} className="text-muted" />
            <input 
              placeholder="Buscar equipo GMAO por nombre, modelo o referencia..." 
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <select 
              className="btn" style={{ background: 'var(--bg)', borderRadius: '8px' }}
              value={filterBuilding}
              onChange={e => setFilterBuilding(e.target.value)}
            >
              <option value="all">Todos los edificios</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
            <button className="btn btn-primary">
              <Plus size={18} /> Nuevo Activo
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
            {filteredAssets.map(asset => {
              const building = buildings.find(b => b.id === asset.idEdificio);
              const lastChange = new Date(asset.fechaUltimoCambio);
              const yearsSinceChange = differenceInYears(new Date(), lastChange);
              const isOverdue = yearsSinceChange >= 5;

              return (
                <div key={asset.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '100px', height: '100px', background: 'var(--bg)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={32} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h3 style={{ margin: 0 }}>{asset.nombre}</h3>
                        {isOverdue && <AlertTriangle size={20} className="text-error" />}
                      </div>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{asset.modelo} | Ref: {asset.referencia}</p>
                      <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                        <MapPin size={12} /> {building?.nombre} - Planta {asset.planta}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', padding: '0.75rem', background: 'var(--bg)', borderRadius: '8px' }}>
                    <div><strong>Gama GMAO:</strong> {asset.gamaGMAO}</div>
                    <div><strong>Peso:</strong> {asset.peso} kg</div>
                    <div><strong>Medidas:</strong> {asset.medidas}</div>
                    <div className={isOverdue ? 'overdue' : ''}>
                      <strong>Últ. Cambio:</strong> {asset.fechaUltimoCambio}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button className="btn" style={{ flex: 1, fontSize: '0.75rem', background: 'var(--bg)' }}>
                      <FileText size={14} /> Manuales
                    </button>
                    <button className="btn" style={{ flex: 1, fontSize: '0.75rem', background: 'var(--bg)' }}>
                      <History size={14} /> Historial
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '0.5rem' }}
                      onClick={() => onNavigateToPartes?.()}
                    >
                      <Wrench size={14} /> Parte
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredAssets.length === 0 && (
              <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', background: 'var(--bg)', border: '2px dashed var(--border)' }}>
                <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                <h3>Edificio sin activos GMAO todavía</h3>
                <p style={{ color: 'var(--text-muted)' }}>Carga los activos para el control preventivo.</p>
              </div>
            )}
          </div>
        </>
      )}

      {showImporter && (
        <InventoryImporter 
          onClose={() => setShowImporter(false)} 
          onComplete={() => setShowImporter(false)} 
        />
      )}
    </div>
  );
}
