import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sendSuccessAlert } from '../src/telegram';
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

  it('토큰이나 챗 ID가 누락되면 false를 반환하고 에러를 던지지 않아야 한다', async () => {
    const originalToken = env.TELEGRAM_BOT_TOKEN;
    const originalChatId = env.TELEGRAM_CHAT_ID;

    try {
      env.TELEGRAM_BOT_TOKEN = undefined;
      env.TELEGRAM_CHAT_ID = undefined;

      const result = await sendSuccessAlert(mockWallet);
      assert.strictEqual(result, false);
    } finally {
      env.TELEGRAM_BOT_TOKEN = originalToken;
      env.TELEGRAM_CHAT_ID = originalChatId;
    }
  });

  it('환경 변수가 설정되어 있으면 텔레그램 메시지를 성공적으로 전송해야 한다', async (t) => {
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      t.skip(
        '.env에 TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID가 설정되어 있지 않아 테스트를 건너뜁니다.',
      );
      return;
    }

    const result = await sendSuccessAlert(mockWallet);
    assert.strictEqual(
      result,
      true,
      '텔레그램 메시지 전송 결과가 true여야 합니다.',
    );
  });
});
