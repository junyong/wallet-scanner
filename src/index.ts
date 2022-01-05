import { ethers } from 'ethers';

(async () => {
  console.log('start');
  const provider = new ethers.providers.EtherscanProvider();
  console.log(provider);
})();
