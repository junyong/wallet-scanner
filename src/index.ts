import { ethers } from 'ethers';
import { env } from './env';
import getDb from './lowdb';
import { sendDailyReport, sendSuccessAlert } from './telegram';
import { Info } from './types';

(async () => {
  console.log('start scanner (ETH + BNB)');
  const startTime = Date.now();
  let scannedCount = 0;
  let dailyScannedCount = 0;

  const initNow = new Date();
  let lastReportDate =
    initNow.getUTCHours() >= 1 ? initNow.toISOString().slice(0, 10) : '';
  let lastReportAttemptTime = 0;

  const db = await getDb();
  const ethProvider = new ethers.providers.JsonRpcProvider(env.JSON_RPC_URL, {
    name: 'mainnet',
    chainId: 1,
  });
  const bnbProvider = new ethers.providers.JsonRpcProvider(
    env.BNB_JSON_RPC_URL,
    {
      name: 'binance',
      chainId: 56,
    },
  );

  const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const condition = true;
  while (condition) {
    try {
      scannedCount++;
      dailyScannedCount++;

      const now = new Date();
      const todayUtc = now.toISOString().slice(0, 10);
      const isReportDue = now.getUTCHours() >= 1 && lastReportDate !== todayUtc;
      const canRetryReport = Date.now() - lastReportAttemptTime > 5 * 60 * 1000;

      if (isReportDue && canRetryReport) {
        lastReportAttemptTime = Date.now();

        const jitterMs = Math.floor(Math.random() * 30000);
        console.log(
          `[DailyReport] Scheduled daily report triggered. Applying jitter: ${(
            jitterMs / 1000
          ).toFixed(1)}s delay...`,
        );
        await timer(jitterMs);

        const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
        const totalHits = db.get('infos').value().length;

        const sent = await sendDailyReport({
          uptimeSeconds,
          dailyScanned: dailyScannedCount,
          totalScanned: scannedCount,
          totalHits,
        });

        if (sent) {
          lastReportDate = todayUtc;
          dailyScannedCount = 0;
          console.log('[DailyReport] Daily report successfully delivered.');
        } else {
          console.warn(
            '[DailyReport] Failed to deliver daily report. Will retry in 5 minutes.',
          );
        }
      }
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;

      const [ethBalance, ethTxCount, bnbBalance, bnbTxCount] =
        await Promise.all([
          ethProvider.getBalance(address),
          ethProvider.getTransactionCount(address),
          bnbProvider.getBalance(address),
          bnbProvider.getTransactionCount(address),
        ]);

      const ethBalanceStr = ethers.utils.formatEther(ethBalance);
      const bnbBalanceStr = ethers.utils.formatEther(bnbBalance);

      console.log(
        `${address} | ETH: ${ethBalanceStr} (tx: ${ethTxCount}) | BNB: ${bnbBalanceStr} (tx: ${bnbTxCount})`,
      );

      if (
        !ethBalance.isZero() ||
        ethTxCount > 0 ||
        !bnbBalance.isZero() ||
        bnbTxCount > 0
      ) {
        const mnemonic = wallet.mnemonic;
        const info: Info = {
          address,
          ethBalance: ethBalanceStr,
          ethTxCount,
          bnbBalance: bnbBalanceStr,
          bnbTxCount,
          mnemonic: mnemonic.phrase,
        };
        console.log('Success! Info:', info);
        await db.get('infos').push(info).write();
        await sendSuccessAlert(info);
      }
      await timer(300);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error('Scan error:', errorMessage);
      await timer(2000);
    }
  }
})();
