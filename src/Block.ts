import { IBlock, IBlockData } from "./types";
import { calculateHash } from "./utils";

interface IBlockCreateInput {
  index: number;
  timestamp: number;
  data: IBlockData;
  previousHash: string;
  hash: string;
  nonce: number;
}

export class Block implements IBlock {
  index: IBlock["index"];
  timestamp: IBlock["timestamp"];
  previousHash: IBlock["previousHash"];
  data: IBlock["data"];
  hash: IBlock["hash"];
  nonce: IBlock["nonce"];

  constructor(input: IBlockCreateInput) {
    this.index = input.index;
    this.timestamp = input.timestamp;
    this.previousHash = input.previousHash;
    this.data = input.data;
    this.hash = input.hash;
    this.nonce = input.nonce;
  }
}
