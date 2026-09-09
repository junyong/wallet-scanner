import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUptime,
  sendDailyReport,
  sendSuccessAlert,
} from '../src/telegram';
import { env } from '../src/env';
import { Info } from '../src/types';

describe('Telegram Alert Service', () => {
  const mockWallet: Info = {
    address: '0x71C84166263735FB61a808B7b8879B1f06A16C2',
    ethBalance: '0.05',
    ethTxCount: 3,
    bnbBalance: '1.25',
    bnbTxCount: 12,
    mnemonic: 'test test test test test test test test test test test junk',
  };

  it('should format seconds into human readable uptime string', () => {
    assert.strictEqual(formatUptime(45), '45s');
    assert.strictEqual(formatUptime(125), '2m 5s');
    assert.strictEqual(formatUptime(3665), '1h 1m 5s');
    assert.strictEqual(formatUptime(90061), '1d 1h 1m 1s');
  });

  it('should return false without throwing when token or chatId is missing', async () => {
    const originalToken = env.TELEGRAM_BOT_TOKEN;
    const originalChatId = env.TELEGRAM_CHAT_ID;

    try {
      env.TELEGRAM_BOT_TOKEN = undefined;
      env.TELEGRAM_CHAT_ID = undefined;

      const alertResult = await sendSuccessAlert(mockWallet);
      assert.strictEqual(alertResult, false);

      const reportResult = await sendDailyReport({
        uptimeSeconds: 3600,
        dailyScanned: 1000,
        totalScanned: 1000,
        totalHits: 0,
      });
      assert.strictEqual(reportResult, false);
    } finally {
      env.TELEGRAM_BOT_TOKEN = originalToken;
      env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });

  it('should send success alert when environment variables are set', async (t) => {
    if (
      process.env.TEST_REAL_TELEGRAM &&
      (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)
    ) {
      t.skip(
        'Skipping test because TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env',
      );
      return;
    }

    const originalFetch = globalThis.fetch;
    const originalToken = env.TELEGRAM_BOT_TOKEN;
    const originalChatId = env.TELEGRAM_CHAT_ID;

    try {
      if (!process.env.TEST_REAL_TELEGRAM) {
        env.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || 'mock_token';
        env.TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || 'mock_chat_id';
      }

      let sentPayload: { chat_id?: string; text?: string } | undefined;
      if (!process.env.TEST_REAL_TELEGRAM) {
        globalThis.fetch = (async (_url: string, init?: RequestInit) => {
          sentPayload = JSON.parse((init?.body as string) || '{}');
          return new Response(JSON.stringify({ ok: true, result: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }) as typeof fetch;
      }

      const result = await sendSuccessAlert(mockWallet);
      assert.strictEqual(
        result,
        true,
        'Telegram message delivery result should be true',
      );
      if (!process.env.TEST_REAL_TELEGRAM && sentPayload) {
        assert.strictEqual(sentPayload.chat_id, env.TELEGRAM_CHAT_ID);
        assert.ok(sentPayload.text?.includes(mockWallet.address));
      }
    } finally {
      globalThis.fetch = originalFetch;
      env.TELEGRAM_BOT_TOKEN = originalToken;
      env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });

  it('should send daily report when environment variables are set', async (t) => {
    if (
      process.env.TEST_REAL_TELEGRAM &&
      (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID)
    ) {
      t.skip(
        'Skipping test because TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in .env',
      );
      return;
    }

    const originalFetch = globalThis.fetch;
    const originalToken = env.TELEGRAM_BOT_TOKEN;
    const originalChatId = env.TELEGRAM_CHAT_ID;

    try {
      if (!process.env.TEST_REAL_TELEGRAM) {
        env.TELEGRAM_BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || 'mock_token';
        env.TELEGRAM_CHAT_ID = env.TELEGRAM_CHAT_ID || 'mock_chat_id';
      }

      let sentPayload: { chat_id?: string; text?: string } | undefined;
      if (!process.env.TEST_REAL_TELEGRAM) {
        globalThis.fetch = (async (_url: string, init?: RequestInit) => {
          sentPayload = JSON.parse((init?.body as string) || '{}');
          return new Response(JSON.stringify({ ok: true, result: {} }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }) as typeof fetch;
      }

      const result = await sendDailyReport({
        uptimeSeconds: 86400,
        dailyScanned: 154200,
        totalScanned: 308400,
        totalHits: 1,
      });
      assert.strictEqual(
        result,
        true,
        'Daily report delivery result should be true',
      );
      if (!process.env.TEST_REAL_TELEGRAM && sentPayload) {
        assert.strictEqual(sentPayload.chat_id, env.TELEGRAM_CHAT_ID);
        assert.ok(sentPayload.text?.includes('154,200'));
      }
    } finally {
      globalThis.fetch = originalFetch;
      env.TELEGRAM_BOT_TOKEN = originalToken;
      env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });

  it('should retry when encountering 429 rate limit and succeed if subsequent call succeeds', async () => {
    const originalFetch = globalThis.fetch;
    const originalToken = env.TELEGRAM_BOT_TOKEN;
    const originalChatId = env.TELEGRAM_CHAT_ID;

    try {
      env.TELEGRAM_BOT_TOKEN = 'mock_token';
      env.TELEGRAM_CHAT_ID = 'mock_chat_id';

      let callCount = 0;
      globalThis.fetch = (async () => {
        callCount++;
        if (callCount === 1) {
          return new Response(
            JSON.stringify({
              ok: false,
              error_code: 429,
              description: 'Too Many Requests: retry after 0',
              parameters: { retry_after: 0 },
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return new Response(JSON.stringify({ ok: true, result: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }) as typeof fetch;

      const result = await sendDailyReport({
        uptimeSeconds: 100,
        dailyScanned: 50,
        totalScanned: 50,
        totalHits: 0,
      });

      assert.strictEqual(result, true);
      assert.strictEqual(callCount, 2);
    } finally {
      globalThis.fetch = originalFetch;
      env.TELEGRAM_BOT_TOKEN = originalToken;
      env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });
});
