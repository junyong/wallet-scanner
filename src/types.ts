export type Info = {
  address: string;
  balance: string;
  transactionCount: number;
  mnemonic: string;
};

export type Schema = {
  infos: Info[];
};
