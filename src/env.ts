import dotenv from 'dotenv';

dotenv.config();

export const env = {
  ETHERSCAN_APIKEY: process.env.ETHERSCAN_APIKEY,
  JSON_RPC_URL: process.env.JSON_RPC_URL,
  BNB_JSON_RPC_URL: process.env.BNB_JSON_RPC_URL,
};
