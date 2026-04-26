import { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../../db';
import { 
  Upload, 
  X, 
  Check, 
  Layers, 
  ChevronRight
} from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

const INVENTORY_FIELDS = [
  'idEquipo',
  'edificio',
  'tipoInstalacion',
  'numeroUnidades',
  'tipoMedida',
  'descripcion',
  'localizacion',
  'estado',
  'fechaAlta',
  'fechaBaja',
  'sustituyeA',
  'sustituidoPor',
  'observaciones'
];

export default function InventoryImporter({ onComplete, onClose }: Props) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Select Sheets, 3: Map, 4: Success
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{ total: number; exitos: number; errores: number; logs: string[] }>({ total: 0, exitos: 0, errores: 0, logs: [] });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      setSelectedSheets([wb.SheetNames[0]]);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const startMapping = () => {
    if (!workbook || selectedSheets.length === 0) return;
    
    // Get headers from first selected sheet to initialize mapping
    const ws = workbook.Sheets[selectedSheets[0]];
    const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const fileHeaders = (json[0] as string[]) || [];
    setHeaders(fileHeaders);
    
    // Auto-map logic
    const initialMapping: Record<string, string> = {};
    INVENTORY_FIELDS.forEach(field => {
        const match = fileHeaders.find(h => h && h.toString().toLowerCase().trim().includes(field.toLowerCase()));
        if (match) initialMapping[field] = match.toString();
    });
    setMapping(initialMapping);
    setStep(3);
  };

  const runImport = async () => {
    if (!workbook) return;
    
    let totalFilas = 0;
    let exitos = 0;
    let errores = 0;
    const logs: string[] = [];
    const timestamp = new Date().toISOString();

    for (const sheetName of selectedSheets) {
        const ws = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws); // Row-based objects
        
        for (const row of json as any[]) {
            totalFilas++;
            try {
                const item: any = {
                    idEquipo: row[mapping['idEquipo']] || `EQUIP-${Date.now()}-${totalFilas}`,
                    edificio: row[mapping['edificio']] || sheetName, // Use sheet name as default building
                    tipoInstalacion: row[mapping['tipoInstalacion']] || 'General',
                    numeroUnidades: Number(row[mapping['numeroUnidades']]) || 1,
                    tipoMedida: row[mapping['tipoMedida']] || 'UD',
                    descripcion: row[mapping['descripcion']] || 'Sin descripción',
                    localizacion: row[mapping['localizacion']] || '',
                    estado: (row[mapping['estado']]?.toString().toUpperCase() === 'BAJA') ? 'BAJA' : 'ACTIVO',
                    fechaAlta: row[mapping['fechaAlta']] || timestamp,
                    fechaBaja: row[mapping['fechaBaja']],
                    sustituyeA: row[mapping['sustituyeA']],
                    sustituidoPor: row[mapping['sustituidoPor']],
                    observaciones: row[mapping['observaciones']] || '',
                    createdAt: timestamp,
                    updatedAt: timestamp
                };

                // Validate uniqueness of idEquipo (simplified for MVP: catch errors)
                await db.inventoryItems.add(item);
                exitos++;
            } catch (err: any) {
                errores++;
                logs.push(`Error en fila ${totalFilas} (Hoja: ${sheetName}): ${err.message || 'ID duplicado'}`);
            }
        }
    }

    // Save import log
    await db.inventoryImports.add({
        fecha: timestamp,
        archivoName: 'Importación Excel',
        hojasImportadas: selectedSheets,
        totalFilas,
        exitos,
        errores,
        logs: logs.slice(0, 100)
    });

    setImportResults({ total: totalFilas, exitos, errores, logs });
    setStep(4);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Layers size={24} style={{ color: 'var(--accent)' }} />
            <h2 style={{ margin: 0 }}>Importar Inventario Técnico</h2>
          </div>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {step === 1 && (
          <div style={{ padding: '3rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p>Selecciona el Excel de inventario (.xlsx)</p>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="inv-excel-upload"
            />
            <label htmlFor="inv-excel-upload" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Examinar Archivo
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ marginBottom: '1.5rem', fontWeight: 600 }}>Selecciona las hojas (Edificios) que quieres importar:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: 'var(--bg)', borderRadius: '8px' }}>
              {sheets.map(name => (
                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.5rem', background: 'white', borderRadius: '4px', border: '1px solid var(--border)' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedSheets.includes(name)}
                    onChange={e => {
                        if (e.target.checked) setSelectedSheets([...selectedSheets, name]);
                        else setSelectedSheets(selectedSheets.filter(s => s !== name));
                    }}
                  />
                  <span>{name}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setStep(1)}>Atrás</button>
              <button className="btn btn-primary" onClick={startMapping}>
                Mapear Columnas <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="alert-info" style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                Relaciona las columnas del Excel con los campos del sistema. Si el campo <strong>EDIFICIO</strong> no está mapeado, se usará el nombre de la hoja automáticamente.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '0.5rem' }}>
              {INVENTORY_FIELDS.map(field => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{field.toUpperCase()}</label>
                  <select 
                    className="form-control"
                    value={mapping[field] || ''}
                    onChange={e => setMapping({...mapping, [field]: e.target.value})}
                  >
                    <option value="">-- No importar --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setStep(2)}>Atrás</button>
              <button className="btn btn-primary" onClick={runImport}>
                Iniciar Importación Masiva
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--success)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Check size={32} />
            </div>
            <h3>Importación Finalizada</h3>
            <div className="stats-grid" style={{ marginTop: '2rem' }}>
                <div className="card" style={{ background: 'var(--bg)' }}>
                    <div style={{ fontSize: '0.75rem' }}>Procesados</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{importResults.total}</div>
                </div>
                <div className="card" style={{ background: 'var(--bg)' }}>
                    <div style={{ fontSize: '0.75rem' }}>Éxitos</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{importResults.exitos}</div>
                </div>
                <div className="card" style={{ background: 'var(--bg)' }}>
                    <div style={{ fontSize: '0.75rem' }}>Errores</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--error)' }}>{importResults.errores}</div>
                </div>
            </div>
            
            {importResults.errores > 0 && (
                <div style={{ marginTop: '1.5rem', textAlign: 'left', maxHeight: '150px', overflowY: 'auto', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid var(--error)' }}>
                    <p style={{ color: 'var(--error)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '0.5rem' }}>Detalle de errores:</p>
                    {importResults.logs.map((log, i) => <div key={i} style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>• {log}</div>)}
                </div>
            )}

            <button className="btn btn-primary" style={{ marginTop: '2rem', width: '100%' }} onClick={onComplete}>
              Cerrar y Ver Inventario
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
      `}} />
    </div>
  );
}
