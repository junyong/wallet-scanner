import { ethers } from 'ethers';
import { env } from './env';
import getDb from './lowdb';
import { sendSuccessAlert } from './telegram';
import { Info } from './types';

(async () => {
  console.log('start scanner (ETH + BNB)');
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
