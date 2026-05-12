import { db } from '../db';

export interface ParsedTelegramMessage {
  type: 'inventory' | 'purchase' | 'workOrder' | 'unknown';
  data: any;
}

export function parseTelegramMessage(text: string): ParsedTelegramMessage {
  if (!text) return { type: 'unknown', data: {} };
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
}

export async function sendTelegramMessage(text: string, overrideChatId?: number) {
  try {
    const settings = await db.settings.toCollection().first();
    const chatId = overrideChatId || settings?.telegramChatId;
    
    if (!settings?.telegramToken || !chatId) {
      console.warn('Telegram no configurado. Token o Chat ID ausente.');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error al enviar mensaje a Telegram:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error de red con Telegram:', error);
    return false;
  }
}

function escapeHTML(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function syncTelegramUpdates() {
  try {
    const settings = await db.settings.toCollection().first();
    if (!settings || !settings.telegramToken) return 0;

    const offset = settings.lastTelegramUpdateId ? settings.lastTelegramUpdateId + 1 : 0;
    const res = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/getUpdates?offset=${offset}`);
    const data = await res.json();

    if (data.ok && data.result.length > 0) {
      let maxUpdateId = settings.lastTelegramUpdateId || 0;
      
      for (const update of data.result) {
        if (update.update_id > maxUpdateId) maxUpdateId = update.update_id;
        
        if (update.message && update.message.text) {
          const text = update.message.text;
          const t = text.trim().toUpperCase();
          const currentChatId = update.message.chat.id;

          // COMANDOS (Mensajes que empiezan por /)
          if (t.startsWith('/')) {
            console.log('Comando detectado:', t);
            
            // Ayuda
            if (t.startsWith('/AYUDA') || t.startsWith('/HELP') || t.startsWith('/START')) {
              const helpText = `<b>Guía de Comandos MantPro ERP</b> 🚀\n\n` +
                `• <b>ALTA:</b> ID | Edif | Planta | Desc\n` +
                `• <b>COMPRA:</b> Prov | Importe | Concepto\n` +
                `• <b>PARTE:</b> ID Equipo | Tarea realizada\n` +
                `• <b>/BUSCAR:</b> [término] (para hallar un ID)\n\n` +
                `<i>Ejemplo: PARTE: EXT-01 | Revisión anual</i>`;
              
              await sendTelegramMessage(helpText, currentChatId);
            } 
            // Búsqueda
            else if (t.startsWith('/BUSCAR') || t.startsWith('/FIND')) {
              const query = text.replace(/^\/\w+[:\s]*/i, '').toLowerCase().trim();
              console.log('Buscando equipos para:', query);

              if (!query) {
                await sendTelegramMessage('⚠️ Indica qué quieres buscar. Ejemplo: <code>/buscar aire</code>', currentChatId);
              } else {
                const totalItems = await db.inventoryItems.count();
                if (totalItems === 0) {
                  await sendTelegramMessage('📭 El inventario está vacío. Registra equipos primero usando el comando <b>ALTA:</b>', currentChatId);
                } else {
                  const items = await db.inventoryItems
                    .filter(item => 
                      (item.idEquipo?.toLowerCase().includes(query)) || 
                      (item.descripcion?.toLowerCase().includes(query))
                    )
                    .limit(5)
                    .toArray();

                  if (items.length === 0) {
                    await sendTelegramMessage(`❌ No se encontraron equipos con "<b>${escapeHTML(query)}</b>"`, currentChatId);
                  } else {
                    let responseText = `🔍 <b>Resultados para "${escapeHTML(query)}":</b>\n\n`;
                    items.forEach(item => {
                      responseText += `• <b>ID:</b> <code>${escapeHTML(item.idEquipo)}</code> \n  <i>${escapeHTML(item.descripcion)}</i> (${escapeHTML(item.edificio)})\n\n`;
                    });
                    if (items.length === 5) responseText += `<i>...mostrando solo los 5 primeros.</i>`;
                    await sendTelegramMessage(responseText, currentChatId);
                  }
                }
              }
            } else {
              await sendTelegramMessage('❓ Comando no reconocido. Escribe <b>/ayuda</b> para ver las opciones.', currentChatId);
            }

            continue; // IMPORTANTE: Cualquier comando se descarta para el buzón
          }

          const { type, data: parsedData } = parseTelegramMessage(text);
          
          await db.telegramInbox.add({
            updateId: update.update_id,
            fromName: update.message.from.first_name,
            date: update.message.date * 1000,
            text: text,
            processed: false,
            type,
            parsedData
          });
        }
      }
      
      await db.settings.update(settings.id!, { lastTelegramUpdateId: maxUpdateId });
      return data.result.length;
    }
    return 0;
  } catch (err) {
    console.error('Error sincronizando Telegram:', err);
    return -1;
  }
}
