import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db } from '../db';
import { Upload, X, Check, ArrowRight } from 'lucide-react';

interface Props {
  targetTable: 'employees' | 'suppliers' | 'orders' | 'assets';
  onComplete: () => void;
  onCancel: () => void;
}

export default function ExcelMapper({ targetTable, onComplete, onCancel }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Success

  // Configuration for target table fields
  const tableFields: Record<string, string[]> = {
    employees: ['nombre', 'apellidos', 'dni', 'profesion', 'telefono', 'pinTelefono', 'imei', 'modeloTelefono', 'tarjetaAcceso', 'nllaveEASMU'],
    suppliers: ['nombre', 'telefono', 'email', 'comercial'],
    orders: ['descripcion', 'unidades', 'precioPVP', 'descuento', 'idEdificio'],
    assets: ['nombre', 'modelo', 'referencia', 'idEdificio', 'planta', 'gamaGMAO']
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const fileHeaders = json[0] as string[];
      const fileRows = json.slice(1);
      
      setHeaders(fileHeaders);
      setData(fileRows);
      
      // Auto-mapping logic (exact match)
      const initialMapping: Record<string, string> = {};
      tableFields[targetTable].forEach(field => {
        const match = fileHeaders.findIndex(h => h.toLowerCase().trim() === field.toLowerCase());
        if (match !== -1) initialMapping[field] = fileHeaders[match];
      });
      setMapping(initialMapping);
      setStep(2);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const cleanData = data.map(row => {
      const obj: any = {};
      tableFields[targetTable].forEach(field => {
        const headerName = mapping[field];
        if (headerName) {
          const index = headers.indexOf(headerName);
          obj[field] = row[index];
        }
      });
      return obj;
    });

    try {
      if (targetTable === 'employees') await db.employees.bulkAdd(cleanData);
      if (targetTable === 'suppliers') await db.suppliers.bulkAdd(cleanData);
      if (targetTable === 'orders') await db.orders.bulkAdd(cleanData);
      if (targetTable === 'assets') await db.assets.bulkAdd(cleanData);
      
      setStep(3);
    } catch (err) {
      console.error("Error al importar:", err);
      alert("Hubo un error en la importación. Revisa los datos.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h2>Cargar {targetTable.toUpperCase()} desde Excel</h2>
          <X size={24} style={{ cursor: 'pointer' }} onClick={onCancel} />
        </div>

        {step === 1 && (
          <div style={{ padding: '3rem', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
            <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <p>Selecciona tu archivo .xlsx o .csv</p>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
              Examinar Archivo
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Relaciona las columnas de tu archivo con los campos del sistema:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {tableFields[targetTable].map(field => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>{field.toUpperCase()}</label>
                  <select 
                    value={mapping[field] || ''} 
                    onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}
                  >
                    <option value="">-- No importar --</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" style={{ background: 'var(--bg)' }} onClick={() => setStep(1)}>Atrás</button>
              <button className="btn btn-primary" onClick={handleImport}>
                Comenzar Importación <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'white' }}>
              <Check size={32} />
            </div>
            <h3>¡Importación Completada!</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Se han añadido {data.length} registros correctamente.</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onComplete}>
              Cerrar y Ver Datos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
