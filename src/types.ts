export interface IBlock {
  index: number;
  timestamp: number;
  previousHash: string;
  hash: string;
  data: IBlockData;
  nonce: number;
}

export interface IBlockData {
  amount: number;
}
