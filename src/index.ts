import { ethers } from 'ethers';
import { env } from './env';

(async () => {
  console.log('start');
  const provider = new ethers.providers.EtherscanProvider(
    undefined,
    env.ETHERSCAN_APIKEY,
  );
  console.log(provider);
})();
