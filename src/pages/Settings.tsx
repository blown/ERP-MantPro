import { useState, useEffect } from 'react';
import { db, type Settings } from '../db';
import { Save, Building2, Calculator } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    nombreEmpresa: '',
    cifEmpresa: '',
    logoEmpresa: '',
    numeroArea: '',
    importeFranquicia: 0,
    direccionEntrega: ''
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.settings.toCollection().first().then(s => {
      if (s) setSettings(s);
    });
  }, []);

  const handleSave = async () => {
    if (settings.id) {
      await db.settings.put(settings);
    } else {
      await db.settings.add(settings);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ maxWidth: '800px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--bg)', borderRadius: '12px', color: 'var(--warning)' }}>
            <Calculator size={24} />
          </div>
          <div>
            <h3>Parámetros de Contrato</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Límites y reglas financieras para la gestión de pedidos.</p>
          </div>
        </div>

        <div style={{ maxWidth: '300px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Importe de Franquicia (€)</label>
            <input 
              type="number"
              className="card" 
              style={{ padding: '0.75rem', border: '1px solid var(--border)', fontSize: '1.25rem', fontWeight: 700 }}
              value={settings.importeFranquicia}
              onChange={(e) => handleInputChange('importeFranquicia', Number(e.target.value))}
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Los pedidos que superen este valor se marcarán automáticamente como Obra (puedes anularlo manualmente en cada pedido).</p>
          </div>
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2rem' }}>
          {saved && <span style={{ color: 'var(--success)', fontWeight: 600 }}>✅ Configuración guardada</span>}
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '0.75rem 2rem' }}>
            <Save size={20} /> Guardar Todo
          </button>
        </div>
      </div>
    </div>
  );
}
