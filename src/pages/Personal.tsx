import { useState } from 'react';
import { db, type Employee } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { User, Phone, Plus, Trash2, FolderOpen, Edit3, Save, X, Shirt, Key, FileSpreadsheet, Calendar, Settings as SettingsIcon, Link as LinkIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatDate } from '../utils/dateUtils';

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
  const [showImportVacation, setShowImportVacation] = useState(false);
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

  return (
    <div className="personal-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h2>Gestión de Personal</h2>
          <p style={{ color: 'var(--text-muted)' }}>Gestión de oficiales, titulaciones y equipos corporativos.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="btn" onClick={() => setShowGuardiaList(true)} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <FolderOpen size={20} /> Ver Lista
            </button>
            <button className="btn" onClick={() => setShowImportGuardia(true)} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <FileSpreadsheet size={20} /> Cargar Guardias
            </button>
            <button className="btn" onClick={async () => {
              if (confirm('¿Estás seguro de que quieres eliminar TODA la lista de guardias?')) {
                await db.guardiaWeeks.clear();
                alert('Lista de guardias eliminada correctamente.');
              }
            }} style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--error)' }}>
              <Trash2 size={20} /> Eliminar Lista
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" onClick={() => {
              if (settings?.vacationLink) {
                window.open(settings.vacationLink, '_blank');
              } else {
                setTempLink('');
                setShowVacationLinkModal(true);
              }
            }} style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <Calendar size={20} /> Vacaciones (Drive)
            </button>
            <button className="btn" onClick={() => setShowImportVacation(true)} style={{ padding: '0.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }} title="Cargar archivo Excel">
              <Plus size={16} />
            </button>
            <button className="btn" onClick={() => {
              setTempLink(settings?.vacationLink || '');
              setShowVacationLinkModal(true);
            }} style={{ padding: '0.5rem', background: 'var(--bg)', border: '1px solid var(--border)' }} title="Configurar Enlace">
              <SettingsIcon size={16} />
            </button>
            <button className="btn" onClick={async () => {
              if (confirm('¿Borrar todos los datos de vacaciones?')) {
                await db.vacationEntries.clear();
                await db.vacationBalances.clear();
              }
            }} style={{ padding: '0.5rem', background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--error)' }} title="Eliminar Datos">
              <Trash2 size={16} />
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={20} /> Añadir Trabajador
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                    const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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
                    let currentYear = new Date().getFullYear();

                    for (const row of rows) {
                      let excelDate = row[0];
                      const operarioNombre = row[1];

                      if (!excelDate || !operarioNombre) continue;

                      // Handle cases where excelDate might be a string
                      excelDate = Number(excelDate);
                      if (isNaN(excelDate)) continue;

                      // Convert Excel serial date to JS Date (UTC to avoid timezone offsets)
                      // 25569 is the difference in days between 1900-01-01 and 1970-01-01
                      const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
                      
                      // Ensure we work in UTC to get consistent week numbers
                      const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
                      const dayNum = d.getUTCDay() || 7;
                      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
                      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

                      guardiaWeeks.push({
                        anio: d.getUTCFullYear(),
                        semana: weekNo,
                        fechaInicio: date.toISOString().split('T')[0],
                        operarioNombre: String(operarioNombre).trim()
                      });
                      
                      currentYear = d.getUTCFullYear();
                    }

                    if (guardiaWeeks.length > 0) {
                      await db.guardiaWeeks.where('anio').equals(currentYear).delete();
                      await db.guardiaWeeks.bulkAdd(guardiaWeeks);
                      alert(`¡Éxito! Se han cargado ${guardiaWeeks.length} semanas para el año ${currentYear}.`);
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
            
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
              {guardiaList.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                      const endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000);
                      const endStr = endDate.toISOString().split('T')[0];
                      const isCurrent = todayStr >= start && todayStr <= endStr;
                      
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
      {showImportVacation && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Importar Vacaciones</h2>
              <button className="btn" onClick={() => setShowImportVacation(false)}><X size={20} /></button>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Selecciona el archivo <strong>vacaciones.xlsx</strong> descargado de Drive.
            </p>

            <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center', marginBottom: '1.5rem' }}>
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                id="vacation-upload"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsImporting(true);
                  try {
                    const data = await file.arrayBuffer();
                    const workbook = XLSX.read(data);
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                    const year = Number(json[0][0]) || new Date().getFullYear();
                    const entries: any[] = [];
                    const balances: any[] = [];

                    const dateMap: string[] = [];
                    const monthsDays = [31, (year % 4 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    for (let m = 0; m < 12; m++) {
                      for (let d = 1; d <= monthsDays[m]; d++) {
                        const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        dateMap.push(dateStr);
                      }
                    }

                    for (let i = 2; i < json.length; i++) {
                      const row = json[i];
                      if (!row || row.length < 1) continue;
                      const rawName = String(row[0] || '').trim();
                      if (!rawName || rawName === '' || rawName.toLowerCase() === 'nombre' || rawName.length < 2) continue;
                      const operarioNombre = rawName.toUpperCase();

                      for (let j = 0; j < dateMap.length; j++) {
                        const cellValue = String(row[j + 1] || '').trim().toUpperCase();
                        if (cellValue === 'V' || cellValue === 'C' || cellValue === 'F') {
                          entries.push({ operarioNombre, anio: year, tipo: cellValue, fecha: dateMap[j] });
                        }
                      }

                      const summaryOffset = 1 + dateMap.length;
                      if (row.length > summaryOffset) {
                        balances.push({
                          operarioNombre,
                          anio: year,
                          vacacionesSolicitadas: Number(row[summaryOffset]) || 0,
                          vacacionesRestantes: Number(row[summaryOffset + 1]) || 0,
                          compensatoriosSolicitados: Number(row[summaryOffset + 2]) || 0,
                          compensatoriosRestantes: Number(row[summaryOffset + 3]) || 0,
                          diasXHoras: Number(row[summaryOffset + 4]) || 0,
                          festivosEnVacaciones: Number(row[summaryOffset + 5]) || 0
                        });
                      }
                    }

                    if (entries.length === 0 && balances.length === 0) {
                      alert('No se encontraron datos. Verifica el formato del Excel.');
                      return;
                    }

                    await db.transaction('rw', [db.vacationEntries, db.vacationBalances], async () => {
                      await db.vacationEntries.where('anio').equals(year).delete();
                      await db.vacationBalances.where('anio').equals(year).delete();
                      await db.vacationEntries.bulkAdd(entries);
                      await db.vacationBalances.bulkAdd(balances);
                    });

                    alert(`¡Éxito! Se han cargado ${balances.length} operarios y ${entries.length} ausencias.`);
                    setShowImportVacation(false);
                  } catch (error) {
                    console.error(error);
                    alert('Error al procesar el archivo.');
                  } finally {
                    setIsImporting(false);
                  }
                }}
              />
              <label htmlFor="vacation-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                {isImporting ? 'Procesando...' : <><Plus size={18} /> Seleccionar Archivo</>}
              </label>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="btn" onClick={() => setShowImportVacation(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
