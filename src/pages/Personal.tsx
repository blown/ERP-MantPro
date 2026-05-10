import { useState } from 'react';
import { db, type Employee } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { User, Phone, Plus, Trash2, FolderOpen, Edit3, Save, X, Shirt, Key, FileSpreadsheet, Calendar, Settings as SettingsIcon, Link as LinkIcon, ExternalLink, Clock, Shield } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate, getISOWeek } from '../utils/dateUtils';

interface PersonalPageProps {
  onNavigateToRopa?: (empId: number) => void;
}

export default function PersonalPage({ onNavigateToRopa }: PersonalPageProps) {
  const employees = useLiveQuery(() => db.employees.toArray()) || [];
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [showImportGuardia, setShowImportGuardia] = useState(false);
  const [showGuardiaList, setShowGuardiaList] = useState(false);
  const [showVacationLinkModal, setShowVacationLinkModal] = useState(false);
  const [showGuardiaLinkModal, setShowGuardiaLinkModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingGuardia, setIsSyncingGuardia] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const guardiaList = useLiveQuery(() => db.guardiaWeeks.orderBy('fechaInicio').toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [tempLink, setTempLink] = useState('');

  const handleDelete = async (id: number) => {
    if (confirm('¿Estás seguro de eliminar a este trabajador?')) {
      await db.employees.delete(id);
    }
  };

  const handleOpenEdit = (emp: Employee) => {
    setSelectedEmp(emp);
    setModalMode('edit');
  };

  const handleOpenAdd = () => {
    setSelectedEmp(null);
    setModalMode('add');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedEmp(null);
  };

  const handleSyncDrive = async () => {
    if (!settings?.vacationLink) {
      alert('Primero debes configurar el enlace de Vacaciones (Drive).');
      return;
    }

    let url = settings.vacationLink;
    // Convert regular edit link to CSV export link if necessary
    if (url.includes('/edit')) {
      url = url.replace(/\/edit.*$/, '/export?format=csv');
    } else if (url.includes('/pubhtml')) {
      url = url.replace('/pubhtml', '/pub?output=csv');
    }

    setIsSyncing(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo acceder al archivo. Verifica que esté publicado en la web.');
      
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => {
        // Simple CSV split (handles basic quotes but this sheet seems simple)
        return row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
      });

      if (rows.length < 3) throw new Error('El archivo no parece tener el formato correcto.');

      const year = parseInt(rows[0][0]) || new Date().getFullYear();
      const entries: any[] = [];
      const balances: any[] = [];

      // Generate date map for the year
      const dateMap: string[] = [];
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      const monthsDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      
      for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= monthsDays[m]; d++) {
          dateMap.push(`${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
        }
      }

      // Process each employee row (starting from row 2)
      for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;
        
        const name = row[0].toUpperCase();
        if (!name || name === 'NOMBRE' || name === '' || name.includes('EMPLEADO')) continue;

        // 1. Process Day Columns (1 to 365/366)
        for (let j = 0; j < dateMap.length; j++) {
          const colIdx = j + 1;
          const val = row[colIdx]?.toUpperCase();
          if (val === 'V' || val === 'C' || val === 'F' || val === 'PER' || val === 'REC') {
            entries.push({
              operarioNombre: name,
              anio: year,
              tipo: val,
              fecha: dateMap[j]
            });
          }
        }

        // 2. Process Summary Columns (offset by dateMap.length + extra columns if any)
        // In the specific format: Summary starts after Dec 31 (col 366 for non-leap)
        const summaryOffset = dateMap.length + 1; 
        // Some sheets have extra columns (like Jan 2027) - we need to find "Días solicitados"
        // For simplicity, we use the offset found in the sample: dateMap.length + 1 + (extra columns)
        // Based on analysis, the summary columns are at the end.
        if (row.length > summaryOffset + 5) {
          balances.push({
            operarioNombre: name,
            anio: year,
            vacacionesSolicitadas: parseFloat(row[row.length - 6]) || 0,
            vacacionesRestantes: parseFloat(row[row.length - 5]) || 0,
            compensatoriosSolicitados: parseFloat(row[row.length - 4]) || 0,
            compensatoriosRestantes: parseFloat(row[row.length - 3]) || 0,
            diasXHoras: parseFloat(row[row.length - 2]) || 0,
            festivosEnVacaciones: parseFloat(row[row.length - 1]) || 0
          });
        }
      }

      await db.transaction('rw', [db.vacationEntries, db.vacationBalances], async () => {
        await db.vacationEntries.where('anio').equals(year).delete();
        await db.vacationBalances.where('anio').equals(year).delete();
        await db.vacationEntries.bulkAdd(entries);
        await db.vacationBalances.bulkAdd(balances);
      });

      alert(`Sincronización completada: ${balances.length} operarios actualizados.`);
    } catch (err: any) {
      console.error(err);
      alert('Error en la sincronización: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncGuardia = async () => {
    if (!settings?.guardiaLink) {
      alert('Primero debes configurar el enlace de Guardias (Drive) en Configuración.');
      return;
    }

    let url = settings.guardiaLink;
    if (url.includes('/edit')) {
      url = url.replace(/\/edit.*$/, '/export?format=csv');
    } else if (url.includes('/pubhtml')) {
      url = url.replace('/pubhtml', '/pub?output=csv');
    }

    setIsSyncingGuardia(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('No se pudo acceder al archivo de guardias.');
      
      const csvText = await response.text();
      const rows = csvText.split('\n').map(row => row.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));

      const guards: any[] = [];
      
      const getISOWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return {
          week: Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7),
          year: d.getUTCFullYear()
        };
      };

      rows.forEach(row => {
        if (row.length < 2) return;
        const dateStr = row[0];
        const name = row[1];
        
        // Simple date validation (d/m/yyyy)
        if (dateStr && dateStr.includes('/') && name && name.length > 2) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            if (!isNaN(d.getTime())) {
              const { week, year } = getISOWeek(d);
              guards.push({
                anio: year,
                semana: week,
                fechaInicio: d.toISOString().split('T')[0], // Standardize to YYYY-MM-DD
                operarioNombre: name.toUpperCase()
              });
            }
          }
        }
      });

      if (guards.length === 0) throw new Error('No se encontraron datos de guardia válidos en las columnas A y B.');

      await db.transaction('rw', db.guardiaWeeks, async () => {
        // Clear old guards for the years found in the sheet
        const years = Array.from(new Set(guards.map(g => g.anio)));
        for (const y of years) {
          await db.guardiaWeeks.where('anio').equals(y).delete();
        }
        await db.guardiaWeeks.bulkAdd(guards);
      });

      alert(`Sincronización de guardias completada: ${guards.length} semanas cargadas.`);
    } catch (err: any) {
      console.error(err);
      alert('Error en la sincronización de guardias: ' + err.message);
    } finally {
      setIsSyncingGuardia(false);
    }
  };

  return (
    <div className="personal-container">
      <div className="personal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h2>Gestión de Personal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de oficiales, titulaciones y equipos corporativos.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-end' }}>
          {/* Fila Guardias */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Guardias</span>
            <button className="btn" onClick={handleSyncGuardia} disabled={isSyncingGuardia} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.5rem 0.75rem' }}>
              <LinkIcon size={18} className={isSyncingGuardia ? 'spin' : ''} />
            </button>
            <button className="btn" onClick={() => {
              setTempLink(settings?.guardiaLink || '');
              setShowGuardiaLinkModal(true);
            }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Clock size={20} /> Guardias (Drive)
            </button>
          </div>

          {/* Fila Vacaciones */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>Vacaciones</span>
            <button className="btn" onClick={handleSyncDrive} disabled={isSyncing} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--accent)', padding: '0.5rem 0.75rem' }}>
              <LinkIcon size={18} className={isSyncing ? 'spin' : ''} />
            </button>
            <button className="btn" onClick={() => {
              setTempLink(settings?.vacationLink || '');
              setShowVacationLinkModal(true);
            }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Calendar size={20} /> Vacaciones (Drive)
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ marginTop: '0.5rem' }}>
            <Plus size={20} /> Añadir Trabajador
          </button>
        </div>
      </div>

      <div className="employee-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {employees.map(emp => (
          <div key={emp.id} className="card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleOpenEdit(emp)}
                style={{ border: 'none', background: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                title="Editar"
              >
                <Edit3 size={16} />
              </button>
              <button 
                onClick={() => handleDelete(emp.id!)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700 }}>
                {emp.nombre[0]}{emp.apellidos[0]}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{emp.nombre} {emp.apellidos}</h3>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>{emp.profesion || 'Oficial'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.dni}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Phone size={14} style={{ color: 'var(--accent)' }} />
                <span>{emp.telefono || 'Sin teléfono'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                <Key size={14} style={{ color: 'var(--accent)' }} />
                <span>Llave EASMU: {emp.nllaveEASMU || '-'}</span>
              </div>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
              <a 
                href="https://drive.google.com/drive/folders/1qp8yTcNgEf7IndtvgUHQSD1hwwVX75lM?usp=drive_link" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn" 
                style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <FolderOpen size={12} /> Títulos
              </a>
              <button 
                className="btn" 
                style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => onNavigateToRopa?.(emp.id!)}
              >
                <Shirt size={12} /> Ropa
              </button>
            </div>
          </div>
        ))}

        {employees.length === 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem', border: '2px dashed var(--border)', background: 'transparent' }}>
            <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3>No hay trabajadores registrados</h3>
            <p style={{ color: 'var(--text-muted)' }}>Importa tus oficiales desde un Excel o añádelos manualmente.</p>
          </div>
        )}
      </div>

      {modalMode && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>{modalMode === 'add' ? 'Añadir Nuevo Trabajador' : 'Editar Trabajador'}</h2>
              <button className="btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                nombre: formData.get('nombre') as string,
                apellidos: formData.get('apellidos') as string,
                dni: formData.get('dni') as string,
                profesion: formData.get('profesion') as string,
                telefono: formData.get('telefono') as string,
                imei: formData.get('imei') as string,
                pinTelefono: formData.get('pinTelefono') as string,
                nllaveEASMU: formData.get('nllaveEASMU') as string,
                modeloTelefono: formData.get('modeloTelefono') as string,
                tarjetaAcceso: formData.get('tarjetaAcceso') as string,
                tallaRopa: selectedEmp?.tallaRopa || '', // Preserve existing or default
                titulaciones: selectedEmp?.titulaciones || [],
                guardias: selectedEmp?.guardias || []
              };

              if (modalMode === 'add') {
                await db.employees.add(data);
              } else if (selectedEmp?.id) {
                await db.employees.update(selectedEmp.id, data);
              }
              handleCloseModal();
            }}>
              <div className="grid-2">
                <div className="form-group">
                  <label>Nombre</label>
                  <input name="nombre" defaultValue={selectedEmp?.nombre} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>Apellidos</label>
                  <input name="apellidos" defaultValue={selectedEmp?.apellidos} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>DNI</label>
                  <input name="dni" defaultValue={selectedEmp?.dni} className="card" style={{ width: '100%', padding: '8px' }} required />
                </div>
                <div className="form-group">
                  <label>Profesión</label>
                  <input name="profesion" defaultValue={selectedEmp?.profesion} className="card" style={{ width: '100%', padding: '8px' }} placeholder="Ej: Electricista, Fontanero..." />
                </div>
                <div className="form-group">
                  <label>Teléfono Corporativo</label>
                  <input name="telefono" defaultValue={selectedEmp?.telefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>PIN Teléfono</label>
                  <input name="pinTelefono" defaultValue={selectedEmp?.pinTelefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>IMEI Móvil</label>
                  <input name="imei" defaultValue={selectedEmp?.imei} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>Modelo Móvil</label>
                  <input name="modeloTelefono" defaultValue={selectedEmp?.modeloTelefono} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>Nº de llave EASMU</label>
                  <input name="nllaveEASMU" defaultValue={selectedEmp?.nllaveEASMU} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="form-group">
                  <label>ID Tarjeta Acceso</label>
                  <input name="tarjetaAcceso" defaultValue={selectedEmp?.tarjetaAcceso} className="card" style={{ width: '100%', padding: '8px' }} />
                </div>
              </div>
              <div style={{ marginTop: '20px', textAlign: 'right', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn" onClick={handleCloseModal} style={{ marginRight: '10px' }}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={18} /> {modalMode === 'add' ? 'Guardar Trabajador' : 'Actualizar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showImportGuardia && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Importar Lista de Guardias</h2>
              <button className="btn" onClick={() => setShowImportGuardia(false)}><X size={20} /></button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Selecciona el archivo <strong>guardia.xlsx</strong>. El sistema detectará las semanas y operarios automáticamente.
            </p>

            <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                id="excel-upload"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsImporting(true);
                  try {
                    const data = await file.arrayBuffer();
                    const workbook = XLSX.read(data);
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, cellDates: true });

                    // Find header row
                    let headerIdx = -1;
                    for (let i = 0; i < json.length; i++) {
                      if (json[i].includes('Semana') || json[i].includes('Guardia')) {
                        headerIdx = i;
                        break;
                      }
                    }

                    if (headerIdx === -1) {
                      alert('No se encontró la cabecera "Semana" o "Guardia" en el Excel.');
                      return;
                    }

                    const rows = json.slice(headerIdx + 1);
                    const guardiaWeeks: any[] = [];

                    for (const row of rows) {
                      const excelDateValue = row[0];
                      const operarioNombre = row[1];

                      if (!excelDateValue || !operarioNombre) continue;

                      let date: Date;
                      if (excelDateValue instanceof Date) {
                        date = excelDateValue;
                      } else {
                        // Fallback for serial numbers - use XLSX utility to get parts
                        const num = Number(excelDateValue);
                        if (isNaN(num)) continue;
                        const parsed = XLSX.SSF.parse_date_code(num);
                        date = new Date(parsed.y, parsed.m - 1, parsed.d + 1);
                      }
                      
                      if (excelDateValue instanceof Date) {
                        date = new Date(excelDateValue.getTime() + 86400000);
                      }
                      
                      // Use the shared utility
                      const { year, week } = getISOWeek(date);

                      // Ensure we get the local YYYY-MM-DD accurately
                      const yyyy = date.getFullYear();
                      const mm = String(date.getMonth() + 1).padStart(2, '0');
                      const dd = String(date.getDate()).padStart(2, '0');
                      const fechaIso = `${yyyy}-${mm}-${dd}`;

                      guardiaWeeks.push({
                        anio: year,
                        semana: week,
                        fechaInicio: fechaIso,
                        operarioNombre: String(operarioNombre).trim()
                      });
                    }

                    if (guardiaWeeks.length > 0) {
                      await db.guardiaWeeks.clear();
                      await db.guardiaWeeks.bulkAdd(guardiaWeeks);
                      alert(`¡Éxito! Se han cargado ${guardiaWeeks.length} semanas.`);
                      setShowImportGuardia(false);
                    } else {
                      alert('No se encontraron datos válidos en el archivo.');
                    }
                  } catch (error) {
                    console.error(error);
                    alert('Error al procesar el archivo Excel.');
                  } finally {
                    setIsImporting(false);
                  }
                }}
              />
              <label htmlFor="excel-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {isImporting ? 'Procesando...' : <><Plus size={18} /> Seleccionar Archivo</>}
              </label>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="btn" onClick={() => setShowImportGuardia(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {showGuardiaList && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Cuadrante de Guardias</h2>
              <button className="btn" onClick={() => setShowGuardiaList(false)}><X size={20} /></button>
            </div>
            
            <div className="table-container" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {guardiaList.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--card-bg)', zIndex: 1 }}>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Semana</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Fecha Inicio</th>
                      <th style={{ textAlign: 'left', padding: '0.75rem' }}>Operario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guardiaList.map((g) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const start = g.fechaInicio;
                      const startDate = new Date(start);
                      let isCurrent = false;
                      
                      if (!isNaN(startDate.getTime())) {
                        const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
                        const endStr = endDate.toISOString().split('T')[0];
                        isCurrent = todayStr >= start && todayStr <= endStr;
                      }
                      
                      return (
                        <tr key={g.id} style={{ borderBottom: '1px solid var(--border)', background: isCurrent ? '#eff6ff' : 'transparent' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 600 }}>Sem. {g.semana}</td>
                          <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>{formatDate(g.fechaInicio)}</td>
                          <td style={{ padding: '0.75rem' }}>
                            <span style={{ 
                              padding: '0.2rem 0.5rem', 
                              borderRadius: '4px', 
                              background: 'var(--bg)',
                              border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent',
                              fontWeight: isCurrent ? 700 : 400
                            }}>
                              {g.operarioNombre}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <FileSpreadsheet size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>No hay guardias cargadas. Importa el archivo Excel para ver la lista.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
              <button className="btn btn-primary" onClick={() => setShowGuardiaList(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showVacationLinkModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Configurar Enlace de Vacaciones</h2>
              <button className="btn" onClick={() => setShowVacationLinkModal(false)}><X size={20} /></button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Pega aquí el enlace de tu hoja de cálculo en <strong>Google Drive</strong> para acceder rápidamente.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Enlace a Google Drive</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    style={{ paddingLeft: '40px', width: '100%' }}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowVacationLinkModal(false)}>Cancelar</button>
              {(tempLink || settings?.vacationLink) && (
                <button className="btn" onClick={() => {
                  let url = tempLink || settings?.vacationLink || '';
                  // If it's a CSV export link, try to show the web view instead
                  if (url.includes('/export?format=csv')) url = url.replace('/export?format=csv', '/edit');
                  if (url.includes('/pub?output=csv')) url = url.replace('/pub?output=csv', '/pubhtml');
                  window.open(url, '_blank');
                }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <ExternalLink size={18} /> Abrir Enlace
                </button>
              )}
              <button className="btn btn-primary" onClick={async () => {
                if (settings?.id) {
                  await db.settings.update(settings.id, { vacationLink: tempLink });
                  alert('Enlace guardado correctamente.');
                  setShowVacationLinkModal(false);
                }
              }}>
                <Save size={18} /> Guardar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

      {showGuardiaLinkModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Configurar Enlace de Guardias</h2>
              <button className="btn" onClick={() => setShowGuardiaLinkModal(false)}><X size={20} /></button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Pega aquí el enlace de tu hoja de cálculo en <strong>Google Drive</strong> para acceder rápidamente.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Enlace a Google Drive</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <LinkIcon size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    className="input" 
                    style={{ paddingLeft: '40px', width: '100%' }}
                    placeholder="https://docs.google.com/spreadsheets/..."
                    value={tempLink}
                    onChange={(e) => setTempLink(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowGuardiaLinkModal(false)}>Cancelar</button>
              {(tempLink || settings?.guardiaLink) && (
                <button className="btn" onClick={() => {
                  let url = tempLink || settings?.guardiaLink || '';
                  // If it's a CSV export link, try to show the web view instead
                  if (url.includes('/export?format=csv')) url = url.replace('/export?format=csv', '/edit');
                  if (url.includes('/pub?output=csv')) url = url.replace('/pub?output=csv', '/pubhtml');
                  window.open(url, '_blank');
                }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <ExternalLink size={18} /> Abrir Enlace
                </button>
              )}
              <button className="btn" onClick={() => setShowGuardiaList(true)} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <FolderOpen size={18} /> Ver Lista
              </button>
              <button className="btn btn-primary" onClick={async () => {
                if (settings?.id) {
                  await db.settings.update(settings.id, { guardiaLink: tempLink });
                  alert('Enlace guardado correctamente.');
                  setShowGuardiaLinkModal(false);
                }
              }}>
                <Save size={18} /> Guardar Enlace
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
