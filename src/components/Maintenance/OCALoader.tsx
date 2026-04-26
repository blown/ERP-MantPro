import { useState } from 'react';
import * as XLSX from 'xlsx';
import { db, type RegulatoryInspection } from '../../db';
import { 
  X, 
  Check, 
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export default function OCALoader({ onComplete, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Result
  const [importResults, setImportResults] = useState<{ total: number; exitos: number; errores: number; logs: string[] }>({ total: 0, exitos: 0, errores: 0, logs: [] });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      let total = 0;
      let exitos = 0;
      let errores = 0;
      const logs: string[] = [];
      const inspections: RegulatoryInspection[] = [];

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        let colIndices = {
          instalacion: 0,
          ultima: 2,
          proxima: 3,
          oca: 5,
          periodo: 6,
          obs: 7
        };

        // Calibrate indices by finding the header row
        const headerRow = data.find(row => 
            row.some(c => c?.toString().toLowerCase().includes('próxima')) || 
            row.some(c => c?.toString().toLowerCase().includes('oca'))
        );

        if (headerRow) {
            headerRow.forEach((cell, idx) => {
                const val = cell?.toString().toLowerCase() || '';
                if (val.includes('instalación') || (val.includes('inspección') && idx < 1)) colIndices.instalacion = idx;
                if (val.includes('última realizada')) colIndices.ultima = idx;
                if (val.includes('próxima')) colIndices.proxima = idx;
                if (val.includes('oca')) colIndices.oca = idx;
                if (val.includes('periodo') || val.includes('período')) colIndices.periodo = idx;
                if (val.includes('observacio')) colIndices.obs = idx;
            });
        }

        let currentBuilding = '';
        let currentBuildingDesc = '';

        data.forEach((row, index) => {
          if (!row || row.length === 0) return;

          const colA = row[colIndices.instalacion]?.toString().trim(); 
          const colC = row[colIndices.ultima]?.toString().trim(); 
          const colD = row[colIndices.proxima]?.toString().trim(); 
          const colF = row[colIndices.oca]?.toString().trim(); 
          const colG = row[colIndices.periodo]?.toString().trim(); 
          const colH = row[colIndices.obs]?.toString().trim(); 

          // Logic to detect Building Header: 
          // 1. Col A has text and is not "INSPECCIONES..."
          // 2. Col D (Next Date) is EMPTY.
          if (colA && !colD && !colF && !colA.toLowerCase().includes('inspecciones')) {
            currentBuilding = colA;
            currentBuildingDesc = colC || '';
            return;
          }

          // Logic to detect Inspection Row:
          // 1. We have a current building.
          // 2. Col D (Next Date) has data that looks like a date/number.
          const isDateValue = colD && (colD.includes('/') || !isNaN(Number(colD)) || !isNaN(Date.parse(colD)));
          if (currentBuilding && isDateValue) {
            // Ignore if it's the header row repeated
            if (colD.toLowerCase().includes('próxima')) return;

            try {
              const inspection: RegulatoryInspection = {
                edificio: currentBuilding,
                descripcionEdificio: currentBuildingDesc,
                instalacion: colA || 'General',
                fechaUltima: parseExcelDate(row[colIndices.ultima]),
                fechaProx: parseExcelDate(row[colIndices.proxima]),
                oca: colF || '',
                periodoAnios: Number(colG) || 0,
                observaciones: colH || '',
                documentos: []
              };
              inspections.push(inspection);
              total++;
            } catch (err: any) {
              errores++;
              logs.push(`Error en fila ${index + 1} (${sheetName}): Formato de fecha inválido.`);
            }
          }
        });
      });

      // Save to DB
      for (const ins of inspections) {
        try {
          await db.regulatoryInspections.add(ins);
          
          // Auto-register OCA company if it doesn't exist
          if (ins.oca) {
            const existing = await db.inspectorCompanies.where('nombre').equals(ins.oca).first();
            if (!existing) {
              await db.inspectorCompanies.add({
                nombre: ins.oca,
                telefono: '',
                email: '',
                direccion: '',
                notas: ''
              });
            }
          }

          exitos++;
        } catch (err: any) {
          errores++;
          logs.push(`Error al guardar: ${err.message}`);
        }
      }

      setImportResults({ total, exitos, errores, logs });
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const parseExcelDate = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'number') {
      // Excel serial date
      const date = new Date((val - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    // Attempt string parse
    const s = val.toString();
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
            // Assume DD/MM/YYYY
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    return new Date(val).toISOString().split('T')[0];
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Importar Inspecciones OCA</h2>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {step === 1 ? (
          <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: '8px', textAlign: 'center' }}>
            <FileSpreadsheet size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
            <p>Sube el Excel con el formato de Inspecciones OCA (Agrupado por edificios)</p>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="oca-upload"
            />
            <label htmlFor="oca-upload" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Seleccionar Archivo
            </label>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--success)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Check size={24} />
            </div>
            <h3>Importación Finalizada</h3>
            <div className="stats-grid" style={{ margin: '1.5rem 0' }}>
              <div className="card" style={{ background: 'var(--bg)' }}>
                <div style={{ fontSize: '0.75rem' }}>Inspecciones</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{importResults.total}</div>
              </div>
              <div className="card" style={{ background: 'var(--bg)' }}>
                <div style={{ fontSize: '0.75rem' }}>Éxitos</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{importResults.exitos}</div>
              </div>
            </div>
            {importResults.errores > 0 && (
                <div style={{ textAlign: 'left', maxHeight: '150px', overflowY: 'auto', padding: '1rem', background: '#fff5f5', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem' }}>
                    {importResults.logs.map((log, i) => <div key={i}>• {log}</div>)}
                </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={onComplete}>Cerrar y Ver Resultados</button>
          </div>
        )}
      </div>
    </div>
  );
}
