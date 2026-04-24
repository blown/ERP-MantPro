import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db, type ProrrateoItem } from '../../db';
import { 
  X, 
  Check, 
  FileSpreadsheet,
  Calendar
} from 'lucide-react';

interface Props {
  onComplete: () => void;
  onClose: () => void;
}

export default function ProrrateoLoader({ onComplete, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1); // 1: Upload, 2: Result
  const [year, setYear] = useState(new Date().getFullYear());
  const [importResults, setImportResults] = useState<{ total: number; exitos: number; errores: number; logs: string[] }>({ total: 0, exitos: 0, errores: 0, logs: [] });

  const parseNumber = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    if (typeof val === 'number') return val;
    // Attempt to clean string (e.g. "700,41" -> 700.41)
    const cleaned = val.toString().replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

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
      const itemsToImport: ProrrateoItem[] = [];

      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        let headerRowIndex = -1;

        // Find header row
        for (let i = 0; i < Math.min(data.length, 10); i++) {
            const row = data[i];
            if (row && row.some(c => c?.toString().toLowerCase().includes('técnico legal') || c?.toString().toLowerCase().includes('enero'))) {
                headerRowIndex = i;
                break;
            }
        }

        const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 1; // Fallback to row 1 if header not found

        for (let i = startIndex; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const servicio = row[0]?.toString().trim();
            const empresa = row[1]?.toString().trim();

            // Stop condition: row containing "Total" in the first column
            if (servicio && servicio.toLowerCase().includes('total:')) {
                break; // Stop processing this sheet
            }

            if (servicio || empresa) { // We have data
                const valoresMensuales = [];
                for (let j = 2; j <= 13; j++) { // Columns C to N (Enero to Diciembre)
                    valoresMensuales.push(parseNumber(row[j]));
                }

                itemsToImport.push({
                    anio: year,
                    servicio: servicio || '',
                    empresa: empresa || '',
                    valoresMensuales
                });
                total++;
            }
        }
      });

      // Confirm before deleting existing data for the selected year
      const existingCount = await db.prorrateo.where('anio').equals(year).count();
      if (existingCount > 0) {
        const confirmReplace = window.confirm(`Ya existen ${existingCount} registros para el año ${year}. ¿Deseas reemplazarlos con este nuevo archivo?`);
        if (!confirmReplace) {
          logs.push('Importación cancelada por el usuario (no se quiso sobreescribir).');
          setImportResults({ total: 0, exitos: 0, errores: 0, logs });
          setStep(2);
          return;
        }
        await db.prorrateo.where('anio').equals(year).delete();
      }

      // Save to DB
      for (const item of itemsToImport) {
        try {
          await db.prorrateo.add(item);
          exitos++;
        } catch (err: any) {
          errores++;
          logs.push(`Error al guardar '${item.servicio}': ${err.message}`);
        }
      }

      setImportResults({ total, exitos, errores, logs });
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Importar Prorrateo desde Excel</h2>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        {step === 1 ? (
          <div style={{ padding: '2rem', border: '2px dashed var(--border)', borderRadius: '8px', textAlign: 'center' }}>
            <FileSpreadsheet size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
            <p>Sube el Excel con el formato de Prorrateo Mensual</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Columnas esperadas: Técnico Legal, Empresa, Enero...Diciembre</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} /> Selecciona el Año a importar:
              </label>
              <input 
                type="number" 
                className="form-control" 
                value={year} 
                onChange={e => setYear(Number(e.target.value))} 
                style={{ width: '100px' }}
              />
            </div>

            <input 
              type="file" 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="prorrateo-upload"
            />
            <label htmlFor="prorrateo-upload" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Seleccionar Archivo e Importar
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
                <div style={{ fontSize: '0.75rem' }}>Registros</div>
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
