import { ec } from "elliptic";

export type IKeyPair = ec.KeyPair;

export type ISignature = ec.Signature;

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
