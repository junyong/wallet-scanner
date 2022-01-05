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
  try {
    while (true) {
      const randomWallet = ethers.Wallet.createRandom();
      const wallet = randomWallet.connect(provider);
      // console.log(wallet);
      const balance = await wallet.getBalance();
      // console.log(`balance = ${balance}`);
      const transactionCount = await wallet.getTransactionCount();
      // console.log(`transactionCount = ${transactionCount}`);

      if (!balance.isZero() || transactionCount > 0) {
        const mnemonic = wallet.mnemonic;
        // console.log(mnemonic.phrase);
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
    }
  } catch (error) {
    console.error(error);
  }
})();
