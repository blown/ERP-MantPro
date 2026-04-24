import React, { useState } from 'react';
import { db, type InventoryItem } from '../../db';
import { 
  X, 
  ArrowRight, 
  ArrowLeftRight, 
  AlertTriangle, 
  Check, 
  Split,
  Calendar,
  Hash,
  FileText
} from 'lucide-react';

interface Props {
  item: InventoryItem;
  onClose: () => void;
}

export default function SubstitutionWizard({ item, onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Split (if needed), 2: Data, 3: Success
  const [splitUnits, setSplitUnits] = useState(1);
  const [newId, setNewId] = useState(`NEW-${item.idEquipo}`);
  const [fechaBaja, setFechaBaja] = useState(new Date().toISOString().split('T')[0]);
  const [fechaAlta, setFechaAlta] = useState(new Date().toISOString().split('T')[0]);
  const [newDescripcion, setNewDescripcion] = useState(item.descripcion);

  const needsSplit = item.numeroUnidades > 1;

  const handleSubstitution = async () => {
    try {
      // 1. Check uniqueness for the NEW ID
      const exists = await db.inventoryItems.where('idEquipo').equals(newId).first();
      if (exists) {
        alert('El ID Equipo de destino ya existe. Por favor utiliza uno nuevo único.');
        return;
      }

      // 2. Transaction for substitution
      await db.transaction('rw', db.inventoryItems, db.inventoryAuditLogs, async () => {
        let oldItemToUpdate = item;

        // desdoblamiento if needed
        if (needsSplit && splitUnits < item.numeroUnidades) {
            // Deduct units from original
            await db.inventoryItems.update(item.id!, { 
                numeroUnidades: item.numeroUnidades - splitUnits,
                updatedAt: new Date().toISOString()
            });

            // Create a temporary "Retired" record for the split units
            const splitId = await db.inventoryItems.add({
                ...item,
                id: undefined,
                idEquipo: `${item.idEquipo}-RETIRED-${Date.now()}`,
                numeroUnidades: splitUnits,
                estado: 'BAJA',
                fechaBaja: fechaBaja,
                sustituidoPor: newId,
                updatedAt: new Date().toISOString()
            });
            
            // We use this as our "old" reference for the link
            oldItemToUpdate = (await db.inventoryItems.get(splitId))!;
        } else {
            // Full substitution
            await db.inventoryItems.update(item.id!, {
                estado: 'BAJA',
                fechaBaja: fechaBaja,
                sustituidoPor: newId,
                updatedAt: new Date().toISOString()
            });
        }

        // 3. Create the NEW active equipment
        await db.inventoryItems.add({
            ...item,
            id: undefined,
            idEquipo: newId,
            numeroUnidades: needsSplit ? splitUnits : item.numeroUnidades,
            estado: 'ACTIVO',
            fechaAlta: fechaAlta,
            fechaBaja: undefined,
            sustituyeA: item.idEquipo, // link back to original ID
            sustituidoPor: undefined,
            descripcion: newDescripcion,
            libroMantenimientoUrl: undefined, // New book needed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // 4. Audit Log
        await db.inventoryAuditLogs.add({
            fecha: new Date().toISOString(),
            usuario: 'OPERARIO_SISTEMA',
            accion: 'SUSTITUCION_EQUIPO',
            itemSelector: item.idEquipo,
            datosPrevios: { idEquipo: item.idEquipo, estado: 'ACTIVO' },
            datosNuevos: { idEquipo: newId, estado: 'ACTIVO', sustituyeA: item.idEquipo },
            resultado: 'EXITO'
        });
      });

      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Error en el protocolo de sustitución.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ background: 'var(--accent)', color: 'white', padding: '0.5rem', borderRadius: '8px' }}>
              <ArrowLeftRight size={20} />
            </div>
            <h2 style={{ margin: 0 }}>Protocolo de Sustitución</h2>
          </div>
          <button className="btn" onClick={onClose}><X size={24} /></button>
        </div>

        {step === 1 && needsSplit && (
          <div>
            <div className="alert alert-info" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '1rem', background: 'rgba(2, 132, 199, 0.05)', border: '1px solid var(--accent)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <Split size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <strong>Detección de unidades múltiples</strong>
                <p style={{ fontSize: '0.85rem', margin: '0.4rem 0 0' }}>Este registro tiene <strong>{item.numeroUnidades} unidades</strong>. ¿Quieres sustituir el bloque completo o solo una parte?</p>
              </div>
            </div>
            
            <div className="form-group">
                <label>Unidades a sustituir</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                        type="range" 
                        min="1" 
                        max={item.numeroUnidades} 
                        value={splitUnits} 
                        onChange={e => setSplitUnits(parseInt(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '1.2rem', minWidth: '40px' }}>{splitUnits}</span>
                </div>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                    Continuar a Datos de Nuevo Equipo <ArrowRight size={18} />
                </button>
            </div>
          </div>
        )}

        {step === 1 && !needsSplit && (
            <div style={{ textAlign: 'center', py: '2rem' }}>
                <p>Estás sustituyendo el equipo único <strong>{item.idEquipo}</strong>.</p>
                <button className="btn btn-primary" onClick={() => setStep(2)} style={{ marginTop: '1rem' }}>
                    Comenzar Proceso <ArrowRight size={18} />
                </button>
            </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', borderLeft: '4px solid var(--error)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>EQUIPO SALIENTE (BAJA)</div>
                <div style={{ fontWeight: 700 }}>{item.idEquipo}</div>
                <div style={{ fontSize: '0.85rem' }}>{item.descripcion}</div>
            </div>

            <div className="form-group">
                <label>ID del Nuevo Equipo (Destino)</label>
                <input 
                    className="form-control" 
                    value={newId} 
                    onChange={e => setNewId(e.target.value)} 
                    placeholder="Ej: BOM-01-REV"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                    <label>Fecha Baja (Actual)</label>
                    <input type="date" className="form-control" value={fechaBaja} onChange={e => setFechaBaja(e.target.value)} />
                </div>
                <div className="form-group">
                    <label>Fecha Alta (Nuevo)</label>
                    <input type="date" className="form-control" value={fechaAlta} onChange={e => setFechaAlta(e.target.value)} />
                </div>
            </div>

            <div className="form-group">
                <label>Descripción Técnica Nuevo Equipo</label>
                <textarea 
                    className="form-control" 
                    rows={3} 
                    value={newDescripcion} 
                    onChange={e => setNewDescripcion(e.target.value)}
                />
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setStep(1)}>Atrás</button>
              <button className="btn btn-primary" onClick={handleSubstitution}>
                Confirmar Sustitución Definitiva
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--success)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <Check size={32} />
                </div>
                <h3>Sustitución Completada</h3>
                <p className="text-muted">El equipo antiguo ha sido dado de baja y el nuevo ID <strong>{newId}</strong> ya está activo en el inventario.</p>
                <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={onClose}>Finalizar y Volver</button>
            </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; }
        .form-control { width: 100%; padding: 0.6rem; border: 1px solid var(--border); borderRadius: 8px; background: var(--white); font-family: inherit; }
      `}} />
    </div>
  );
}
