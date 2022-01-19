/* eslint-disable no-constant-condition */
import { ethers } from 'ethers';
import { env } from './env';
import getDb from './lowdb';
import { Info } from './types';

(async () => {
  console.log('start');
  const db = await getDb();
  const provider = new ethers.providers.EtherscanProvider(
    undefined,
    env.ETHERSCAN_APIKEY,
  );

  const timer = (ms: number) => new Promise((res) => setTimeout(res, ms));
  while (true) {
    try {
      const randomWallet = ethers.Wallet.createRandom();
      const wallet = randomWallet.connect(provider);
      const balance = await wallet.getBalance();
      const transactionCount = await wallet.getTransactionCount();
      console.log(`${wallet.address} - ${balance} - ${transactionCount}`);

      if (!balance.isZero() || transactionCount > 0) {
        const mnemonic = wallet.mnemonic;
        const info: Info = {
          address: wallet.address,
          balance: balance.toNumber(),
          transactionCount,
          mnemonic: mnemonic.phrase,
        };
        console.log(info);
        await db.get('infos').push(info).write();
      }
      await timer(500);
    } catch (error) {
      console.error(error);
      await timer(1000);
    }
  }
})();
