import os from 'os';
import { env } from './env';
import { Info } from './types';

export interface DailyStats {
  uptimeSeconds: number;
  dailyScanned: number;
  totalScanned: number;
  totalHits: number;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

async function sendTelegramMessage(message: string): Promise<boolean> {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return false;
  }

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

export async function sendSuccessAlert(info: Info): Promise<boolean> {
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

  return sendTelegramMessage(message);
}

export async function sendDailyReport(stats: DailyStats): Promise<boolean> {
  const serverInfo = `${env.SERVER_NAME} (${os.platform()}-${os.arch()}, PID: ${process.pid})`;
  const uptimeStr = formatUptime(stats.uptimeSeconds);
  const avgSpeed =
    stats.uptimeSeconds > 0
      ? (stats.dailyScanned / Math.min(stats.uptimeSeconds, 86400)).toFixed(1)
      : '0.0';

  const message = [
    '📊 *[Wallet Scanner] Daily Statistics Report*',
    `• *Server:* \`${serverInfo}\``,
    `• *Uptime:* ${uptimeStr}`,
    `• *Daily Scanned:* ${stats.dailyScanned.toLocaleString()} (~${avgSpeed}/s)`,
    `• *Total Scanned:* ${stats.totalScanned.toLocaleString()}`,
    `• *Hits Found:* ${stats.totalHits}`,
    `• *Status:* 🟢 Running`,
  ].join('\n');

  return sendTelegramMessage(message);
}
