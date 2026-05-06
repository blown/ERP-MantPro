import { useState, useEffect } from 'react';
import { db, type Settings, type Building } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, Building2, Calculator, Plus, Trash2, MapPin, Upload, Database, Download, RefreshCcw } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    nombreEmpresa: '',
    cifEmpresa: '',
    logoEmpresa: '',
    numeroArea: '',
    importeFranquicia: 0,
    direccionEntrega: '',
    firmanteNombre: '',
    firmanteDni: '',
    footerLine: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.settings.toCollection().first().then(s => {
      if (s) setSettings(s);
    });
  }, []);

  const handleSave = async () => {
    const existing = await db.settings.toCollection().first();
    if (existing) {
      await db.settings.put({ ...settings, id: existing.id });
    } else {
      await db.settings.add(settings);
    }
    
    // Recargar para asegurar que tenemos el ID y los datos actualizados
    const updated = await db.settings.toCollection().first();
    if (updated) setSettings(updated);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const buildings = useLiveQuery(() => db.buildings.toArray()) || [];
  const [newBuilding, setNewBuilding] = useState<Building>({ nombre: '', direccion: '', anioApertura: new Date().getFullYear() });

  const handleAddBuilding = async () => {
    if (!newBuilding.nombre) return;
    await db.buildings.add(newBuilding);
    setNewBuilding({ nombre: '', direccion: '', anioApertura: new Date().getFullYear() });
  };

  const handleDeleteBuilding = async (id?: number) => {
    if (!id || !confirm('¿Estás seguro? Se borrará el edificio pero no los activos asociados (se quedarán sin edificio).')) return;
    await db.buildings.delete(id);
  };

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleImportBuildings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws) as any[];

      const importedBuildings = data.map(row => ({
        nombre: row['Nombre'] || row['NOMBRE'] || row['Centro'] || 'Nuevo Centro',
        direccion: row['Dirección'] || row['DIRECCION'] || row['Direccion'] || '',
        anioApertura: Number(row['Año Apertura'] || row['AÑO'] || row['Año'] || new Date().getFullYear())
      }));

      for (const b of importedBuildings) {
        await db.buildings.add(b);
      }
      
      alert(`Se han importado ${importedBuildings.length} edificios correctamente.`);
    };
    reader.readAsBinaryString(file);
  };

  const handleExportBackup = async () => {
    try {
      const data: any = {};
      // Export all tables
      for (const table of db.tables) {
        data[table.name] = await table.toArray();
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mantpro_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al generar la copia de seguridad: ' + err);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('¡ATENCIÓN! Esta acción reemplazará TODOS los datos actuales por los de la copia de seguridad. ¿Deseas continuar?')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        
        // Use a transaction to ensure atomic restore
        await db.transaction('rw', db.tables, async () => {
          for (const table of db.tables) {
            if (data[table.name]) {
              await table.clear();
              await table.bulkAdd(data[table.name]);
            }
          }
        });
        
        alert('Datos restaurados correctamente. La aplicación se recargará para aplicar los cambios.');
        window.location.reload();
      } catch (err) {
        alert('Error al restaurar la copia de seguridad. Asegúrate de que el archivo es válido.\n\nError: ' + err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Sección de Copia de Seguridad - Prominente para dar seguridad */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, var(--card-bg), rgba(2, 132, 199, 0.05))', border: '1px solid var(--accent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--accent)', borderRadius: '12px', color: 'white' }}>
            <Database size={24} />
          </div>
          <div>
            <h3 style={{ color: 'var(--accent)' }}>Seguridad y Copias de Respaldo</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Protege tu información. Exporta todos tus datos a un archivo para guardarlo fuera de tu PC.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleExportBackup}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
          >
            <Download size={18} /> Crear Copia de Seguridad Ahora
          </button>
          
          <div style={{ position: 'relative' }}>
            <input 
              type="file" 
              id="backup-import" 
              style={{ display: 'none' }} 
              accept=".json"
              onChange={handleImportBackup}
            />
            <label 
              htmlFor="backup-import" 
              className="btn" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer',
                background: 'rgba(239, 68, 68, 0.05)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.75rem 1.5rem'
              }}
            >
              <RefreshCcw size={18} /> Restaurar Copia
            </label>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '12px', color: 'var(--accent)' }}>
            <Building2 size={24} />
          </div>
          <div>
            <h3>Datos de Empresa</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Configura la identidad que aparecerá en tus pedidos e informes.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre Comercial</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.nombreEmpresa}
              onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>CIF / NIF</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.cifEmpresa}
              onChange={(e) => handleInputChange('cifEmpresa', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Número de Área</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.numeroArea}
              onChange={(e) => handleInputChange('numeroArea', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Dirección de Entrega</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.direccionEntrega}
              onChange={(e) => handleInputChange('direccionEntrega', e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Importe de Franquicia (€)</label>
            <input 
              type="number"
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)', fontWeight: 700 }}
              value={settings.importeFranquicia}
              onChange={(e) => handleInputChange('importeFranquicia', Number(e.target.value))}
            />
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Nombre del Firmante (Pedidos)</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.firmanteNombre || ''}
              onChange={(e) => handleInputChange('firmanteNombre', e.target.value)}
              placeholder="Ej: D. Julio Caso de los Cobos Fidalgo"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>DNI del Firmante</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.firmanteDni || ''}
              onChange={(e) => handleInputChange('firmanteDni', e.target.value)}
              placeholder="Ej: 9410271-M"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Línea de Pie de Página (Dirección/Contacto)</label>
            <input 
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)' }}
              value={settings.footerLine || ''}
              onChange={(e) => handleInputChange('footerLine', e.target.value)}
              placeholder="Dirección, CIF, Teléfono..."
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '12px', color: 'var(--accent)' }}>
            <MapPin size={24} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <h3>Gestión de Edificios / Centros</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Añade y configura los centros que mantienes.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <input 
                type="file" 
                id="building-import" 
                style={{ display: 'none' }} 
                accept=".xlsx, .xls"
                onChange={handleImportBuildings}
              />
              <label 
                htmlFor="building-import" 
                className="btn" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  cursor: 'pointer',
                  background: 'rgba(34, 197, 94, 0.1)',
                  color: '#15803d',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                  fontWeight: 600,
                  padding: '0.5rem 1rem'
                }}
              >
                <Upload size={18} /> Importar Excel
              </label>
              <button 
                className="btn" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem', 
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  fontWeight: 600,
                  padding: '0.5rem 1rem'
                }}
                onClick={async () => {
                  const inventory = await db.inventoryItems.toArray();
                  const existingNames = buildings.map(b => b.nombre.toLowerCase());
                  const inventoryBuildings = Array.from(new Set(inventory.map(i => i.edificio))).filter(Boolean);
                  
                  let addedCount = 0;
                  for (const name of inventoryBuildings) {
                    if (!existingNames.includes(name.toLowerCase())) {
                      await db.buildings.add({
                        nombre: name,
                        direccion: '',
                        anioApertura: new Date().getFullYear()
                      });
                      addedCount++;
                    }
                  }
                  
                  if (addedCount > 0) {
                    alert(`Se han detectado y añadido ${addedCount} edificios nuevos desde el inventario.`);
                  } else {
                    alert('No se han encontrado edificios nuevos en el inventario.');
                  }
                }}
              >
                <Plus size={18} /> Sincronizar desde Inventario
              </button>
            </div>
          </div>
        </div>

        <div className="card shadow-sm" style={{ marginBottom: '1.5rem', background: 'var(--bg)', padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nombre del Centro</label>
              <input className="form-control" style={{ background: 'white' }} value={newBuilding.nombre} onChange={e => setNewBuilding({...newBuilding, nombre: e.target.value})} placeholder="Ej: Edificio Central" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dirección</label>
              <input className="form-control" style={{ background: 'white' }} value={newBuilding.direccion} onChange={e => setNewBuilding({...newBuilding, direccion: e.target.value})} placeholder="Ej: Calle Mayor 1" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Año Apertura</label>
                <input type="number" className="form-control" style={{ background: 'white' }} value={newBuilding.anioApertura} onChange={e => setNewBuilding({...newBuilding, anioApertura: Number(e.target.value)})} />
              </div>
              <button className="btn btn-primary" style={{ height: '42px', width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={handleAddBuilding}>
                <Plus size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="table-container" style={{ maxHeight: '260px', overflowY: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 10 }}>
              <tr>
                <th>Nombre</th>
                <th>Dirección</th>
                <th style={{ textAlign: 'center' }}>Año</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map(b => (
                <tr key={b.id}>
                  <td>
                    <input 
                      className="form-control" 
                      style={{ border: 'none', background: 'transparent', padding: '0.2rem', fontWeight: 600, width: '100%' }} 
                      value={b.nombre} 
                      onChange={e => db.buildings.update(b.id!, { nombre: e.target.value })} 
                    />
                  </td>
                  <td>
                    <input 
                      className="form-control" 
                      style={{ border: 'none', background: 'transparent', padding: '0.2rem', color: 'var(--text-muted)', width: '100%' }} 
                      placeholder="Sin dirección..."
                      value={b.direccion || ''} 
                      onChange={e => db.buildings.update(b.id!, { direccion: e.target.value })} 
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input 
                      type="number"
                      className="form-control" 
                      style={{ border: 'none', background: 'transparent', padding: '0.2rem', textAlign: 'center', width: '80px' }} 
                      value={b.anioApertura || ''} 
                      onChange={e => db.buildings.update(b.id!, { anioApertura: Number(e.target.value) })} 
                    />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn text-error" style={{ padding: '0.4rem' }} onClick={() => handleDeleteBuilding(b.id)}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card shadow-sm" style={{ marginTop: '2rem' }}>
        <h3>Tipos de Repuesto / Categorías de Gasto</h3>
        <p className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>Define las categorías para clasificar los gastos (Ej: Climatización, Incendios, Electricidad...)</p>
        
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <input 
            id="new-spare-type"
            className="form-control" 
            placeholder="Nueva categoría..." 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) {
                  const current = settings.tiposRepuesto || [];
                  if (!current.includes(val)) {
                    setSettings({...settings, tiposRepuesto: [...current, val]});
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }
            }}
          />
          <button 
            className="btn btn-primary"
            onClick={() => {
              const input = document.getElementById('new-spare-type') as HTMLInputElement;
              const val = input.value.trim();
              if (val) {
                const current = settings.tiposRepuesto || [];
                if (!current.includes(val)) {
                  setSettings({...settings, tiposRepuesto: [...current, val]});
                  input.value = '';
                }
              }
            }}
          >
            Añadir
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {(settings.tiposRepuesto || ['Climatización', 'Incendios', 'Electricidad', 'Alumbrado', 'Fontanería']).map((tipo: string) => (
            <div key={tipo} className="status-badge" style={{ background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.6rem 1.2rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{tipo}</span>
              <button 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--error)', display: 'flex', alignItems: 'center', padding: '2px', borderRadius: '4px', transition: 'background 0.2s' }}
                onClick={() => {
                  const current = settings.tiposRepuesto || ['Climatización', 'Incendios', 'Electricidad', 'Alumbrado', 'Fontanería'];
                  setSettings({...settings, tiposRepuesto: current.filter(t => t !== tipo)});
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
        {saved && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Configuración guardada</span>}
        <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.75rem 2rem' }}>
          <Save size={20} /> Guardar Todo
        </button>
      </div>
    </div>
  );
}
