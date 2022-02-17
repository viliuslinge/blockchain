import { Block, IBlock } from "./Block";

export class Blockchain {
  blocks: Block[];

  constructor(private input: { genesisBlock: Block }) {
    this.blocks = [input.genesisBlock];
  }

  addBlock(data: any): Block | undefined {
    const previousBlock = this.latestBlock;
    if (!previousBlock) {
      console.error(`[Blockchain] could not add block. Missing previous block`);
      return;
    }

    const block: Block = Block.mineBlock({ previousBlock, data });
    this.blocks.push(block);

    return block;
  }

  isChainValid(blocks: Block[]): boolean {
    const firstBlock: string = JSON.stringify(blocks[0]);
    const genesisBlock: string = JSON.stringify(this.input.genesisBlock);

    if (firstBlock !== genesisBlock) {
      return false;
    }

    for (let i = 1; i < blocks.length; i++) {
      const block: Block = this.blocks[i];
      const previousBlock: Block = this.blocks[i - 1];

      if (block.hash !== Block.generateHash(block)) {
        return false;
      }

      if (block.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }

  resetChain(blocks: Block[]): boolean {
    if (blocks.length <= this.blocks.length) {
      return false;
    }

    if (!this.isChainValid(blocks)) {
      return false;
    }

    this.blocks = blocks;

    return true;
  }

  get latestBlock(): Block | undefined {
    return this.blocks[this.blocks.length - 1];
  }
}
