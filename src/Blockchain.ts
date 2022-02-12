import { Block, IBlock } from "./Block";

export class Blockchain {
  chain: Block[];

  constructor() {
    this.chain = [Block.generateGenesisBlock()];
  }

  addBlock(data: IBlock["data"]) {
    const previousBlock = this.latestBlock;
    if (!previousBlock) return;

    this.chain.push(Block.mineBlock({ previousBlock, data }));
  }

  isChainValid(chain: Block[]): boolean {
    const firstBlock: string = JSON.stringify(chain[0]);
    const genesisBlock: string = JSON.stringify(Block.generateGenesisBlock());

    if (firstBlock !== genesisBlock) {
      return false;
    }

    for (let i = 1; i < chain.length; i++) {
      const block: Block = this.chain[i];
      const previousBlock: Block = this.chain[i - 1];

      if (block.hash !== Block.generateHash(block)) {
        return false;
      }

      if (block.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  resetChain(chain: Block[]): boolean {
    if (chain.length <= this.chain.length) {
      return false;
    }

    if (!this.isChainValid(chain)) {
      return false;
    }

    this.chain = chain;

    return true;
  }

  get latestBlock(): Block | undefined {
    return this.chain[this.chain.length - 1];
  }
}
