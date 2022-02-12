import { Block } from "./Block";
import { IBlock, IBlockData } from "./types";
import { calculateHash } from "./utils";

export class Blockchain {
  chain: Block[];
  difficulty: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
  }

  private createGenesisBlock = (): Block => {
    const base: IBlockBase = {
      nonce: 0,
      data: { amount: 1 },
      timestamp: new Date().getTime(),
      index: 0,
      previousHash: "0",
    };

    return {
      ...base,
      hash: calculateHash(base),
    };
  };

  private addBlock = (block: Block) => {
    this.chain.push(block);
  };

  mineBlock = (data: IBlockData) => {
    const base: IBlockBase = {
      nonce: 0,
      data: data,
      timestamp: new Date().getTime(),
      index: this.latestBlock.index + 1,
      previousHash: this.latestBlock.previousHash,
    };

    let hash = calculateHash(base);

    console.log("mining block...");

    while (
      hash.substring(0, this.difficulty) !==
      Array(this.difficulty + 1).join("0")
    ) {
      base.nonce = base.nonce + 1;
      hash = calculateHash(base);
    }

    const block: IBlock = {
      ...base,
      hash: hash,
    };

    this.addBlock(block);

    console.log("BLOCK MINED: ", hash);
  };

  get latestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  get isChainValid(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const block = this.chain[i];
      const prevBlock = this.chain[i - 1];

      if (
        block.hash !==
        calculateHash({
          index: block.index,
          data: block.data,
          timestamp: block.timestamp,
          nonce: block.nonce,
          previousHash: block.previousHash,
        })
      ) {
        return false;
      }

      if (prevBlock.hash !== block.previousHash) {
        return false;
      }
    }

    return true;
  }
}

interface IBlockBase {
  index: number;
  timestamp: number;
  data: IBlockData;
  nonce: number;
  previousHash: string;
}
