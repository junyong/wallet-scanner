export type Info = {
  address: string;
  balance: number;
  transactionCount: number;
  mnemonic: string;
};

export type Schema = {
  infos: Info[];
};
