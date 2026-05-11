import { db } from '../db';

export async function sendTelegramMessage(text: string) {
  try {
    const settings = await db.settings.toCollection().first();
    if (!settings || !settings.telegramToken || !settings.telegramChatId) {
      console.warn('Telegram no configurado. Token o Chat ID ausente.');
      return false;
    }

    const response = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: settings.telegramChatId,
        text: text,
        parse_mode: 'Markdown',
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
