export type Info = {
  address: string;
  ethBalance: string;
  ethTxCount: number;
  bnbBalance: string;
  bnbTxCount: number;
  mnemonic: string;
};

export type Schema = {
  infos: Info[];
};
