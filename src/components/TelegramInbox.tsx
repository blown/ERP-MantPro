import { useState, useEffect } from 'react';
import { db, type TelegramInboxMessage } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  MessageSquare, 
  RefreshCw, 
  Check, 
  X, 
  Trash2, 
  Package, 
  ShoppingCart, 
  ClipboardList,
  AlertCircle
} from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function TelegramInbox({ onClose }: Props) {
  const [syncing, setSyncing] = useState(false);
  const messages = useLiveQuery(() => db.telegramInbox?.where('processed').equals(false).toArray()) || [];
  
  const parseMessage = (text: string): { type: TelegramInboxMessage['type'], data: any } => {
    const t = text.trim().toUpperCase();
    
    if (t.startsWith('ALTA:')) {
      const parts = text.split(':')[1].split('|').map(p => p.trim());
      return {
        type: 'inventory',
        data: {
          idEquipo: parts[0],
          edificio: parts[1],
          planta: parts[2],
          descripcion: parts[3],
          localizacion: parts[4] || ''
        }
      };
    }
    
    if (t.startsWith('COMPRA:')) {
      const parts = text.split(':')[1].split('|').map(p => p.trim());
      return {
        type: 'purchase',
        data: {
          proveedor: parts[0],
          importe: parseFloat(parts[1]?.replace(',', '.') || '0'),
          concepto: parts[2]
        }
      };
    }
    
    if (t.startsWith('PARTE:')) {
      const parts = text.split(':')[1].split('|').map(p => p.trim());
      return {
        type: 'workOrder',
        data: {
          idEquipo: parts[0],
          descripcion: parts[1]
        }
      };
    }
    
    return { type: 'unknown', data: {} };
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const settings = await db.settings.toCollection().first();
      if (!settings?.telegramToken) {
        alert('Configura primero el Token del Bot en Ajustes');
        return;
      }

      const offset = settings.lastTelegramUpdateId ? settings.lastTelegramUpdateId + 1 : 0;
      const res = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/getUpdates?offset=${offset}`);
      const data = await res.json();

      if (data.ok && data.result.length > 0) {
        let maxUpdateId = settings.lastTelegramUpdateId || 0;
        
        for (const update of data.result) {
          if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
          
          if (update.message && update.message.text) {
            const { type, data: parsedData } = parseMessage(update.message.text);
            
            await db.telegramInbox.add({
              updateId: update.update_id,
              fromName: update.message.from.first_name,
              date: update.message.date * 1000,
              text: update.message.text,
              processed: false,
              type,
              parsedData
            });
          }
        }
        
        await db.settings.update(settings.id!, { lastTelegramUpdateId: maxUpdateId });
      }
    } catch (err) {
      console.error('Error sincronizando Telegram:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleProcess = async (msg: TelegramInboxMessage) => {
    try {
      if (msg.type === 'inventory') {
        await db.inventoryItems.add({
          ...msg.parsedData,
          uds: 1,
          medida: 'UD',
          estado: 'ACTIVO',
          fechaAlta: new Date().toISOString().split('T')[0]
        });
      } else if (msg.type === 'purchase') {
        // Lógica simplificada para crear un pedido rápido
        const supplier = await db.suppliers.where('nombre').equalsIgnoreCase(msg.parsedData.proveedor).first();
        const nextNum = (await db.orders.count()) + 1;
        await db.orders.add({
          numeroPedido: nextNum,
          anio: new Date().getFullYear(),
          idProveedor: supplier?.id || 0,
          fechaPedido: new Date().toISOString().split('T')[0],
          estado: 'pendiente',
          observaciones: `Creado desde Telegram: ${msg.parsedData.concepto}`
        });
      } else if (msg.type === 'workOrder') {
        const nextNum = (await db.workOrders.count()) + 1;
        await db.workOrders.add({
          numeroParte: nextNum.toString(),
          operatorIds: [],
          estado: 'pendiente',
          fecha: new Date().toISOString().split('T')[0],
          descripcion: msg.parsedData.descripcion,
          idEquipo: msg.parsedData.idEquipo
        });
      }
      
      await db.telegramInbox.update(msg.id!, { processed: true });
    } catch (err) {
      alert('Error al procesar el mensaje: ' + err);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inventory': return <Package size={18} className="text-accent" />;
      case 'purchase': return <ShoppingCart size={18} style={{ color: '#eab308' }} />;
      case 'workOrder': return <ClipboardList size={18} style={{ color: '#22c55e' }} />;
      default: return <AlertCircle size={18} className="text-muted" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'inventory': return 'Nuevo Equipo';
      case 'purchase': return 'Pedido de Compra';
      case 'workOrder': return 'Parte de Trabajo';
      default: return 'No reconocido';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '700px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <MessageSquare size={24} className="text-accent" />
            <h2 style={{ margin: 0 }}>Buzón de Telegram</h2>
          </div>
          <button className="btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <button 
            className="btn btn-primary" 
            onClick={handleSync} 
            disabled={syncing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={18} className={syncing ? 'spin' : ''} /> 
            {syncing ? 'Sincronizando...' : 'Buscar nuevos mensajes'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p>No hay mensajes pendientes de procesar.</p>
              <p style={{ fontSize: '0.8rem' }}>Usa los comandos ALTA:, COMPRA: o PARTE: en Telegram.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map(msg => (
                <div key={msg.id} className="card shadow-sm" style={{ borderLeft: `4px solid ${msg.type === 'unknown' ? 'var(--border)' : 'var(--accent)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getTypeIcon(msg.type)}
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{getTypeText(msg.type)}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {msg.fromName} • {new Date(msg.date).toLocaleString()}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.9rem', marginBottom: '1rem', background: 'var(--bg)', padding: '0.8rem', borderRadius: '4px', fontFamily: 'monospace' }}>
                    {msg.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                    <button 
                      className="btn text-error" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => db.telegramInbox.delete(msg.id!)}
                    >
                      <Trash2 size={14} /> Descartar
                    </button>
                    {msg.type !== 'unknown' && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => handleProcess(msg)}
                      >
                        <Check size={14} /> Procesar y Añadir
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(2, 132, 199, 0.05)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(2, 132, 199, 0.1)' }}>
          <strong style={{ color: 'var(--accent)' }}>Guía de Comandos:</strong>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <li><code>ALTA: ID | Edif | Planta | Desc</code></li>
            <li><code>COMPRA: Prov | Importe | Concepto</code></li>
            <li><code>PARTE: ID Equipo | Tarea realizada</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
