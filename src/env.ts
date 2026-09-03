import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

export const env = {
  SERVER_NAME: process.env.SERVER_NAME || os.hostname(),
  ETHERSCAN_APIKEY: process.env.ETHERSCAN_APIKEY,
  JSON_RPC_URL: process.env.JSON_RPC_URL,
  BNB_JSON_RPC_URL: process.env.BNB_JSON_RPC_URL,
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
};
