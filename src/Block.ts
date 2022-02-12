import * as utils from "./utils";
import * as config from "./config";

export interface IBlock extends IBlockBase {
  hash: string;
}

interface IBlockBase {
  data: Record<string, any>;
  nonce: number;
  timestamp: number;
  difficulty: number;
  previousHash: string;
}

export class Block implements IBlock {
  hash: string;
  data: IBlock["data"];
  nonce: number;
  timestamp: number;
  difficulty: number;
  previousHash: string;

  constructor(input: IBlock) {
    this.hash = input.hash;
    this.data = input.data;
    this.nonce = input.nonce;
    this.timestamp = input.timestamp;
    this.difficulty = input.difficulty;
    this.previousHash = input.previousHash;
  }

  static mineBlock(input: {
    previousBlock: IBlock;
    data: IBlock["data"];
  }): Block {
    const { previousBlock, data } = input;

    const previousHash: string = previousBlock.hash;
    let timestamp: number = new Date().getTime();
    let nonce: number = 0;
    let difficulty: number = Block.calculateDifficulty({
      previousBlock,
      timestamp,
    });
    let hash: string = Block.generateHash({
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });

    console.log("mining block...");

    while (
      config.HASH_PREFIX.repeat(difficulty) !== hash.substring(0, difficulty)
    ) {
      nonce += 1;
      timestamp = new Date().getTime();
      difficulty = Block.calculateDifficulty({
        previousBlock,
        timestamp,
      });
      hash = Block.generateHash({
        data,
        nonce,
        timestamp,
        difficulty,
        previousHash,
      });
    }

    console.log("BLOCK MINED: ", hash);

    return new Block({
      hash,
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });
  }

  static generateGenesisBlock(): Block {
    // TODO: implement transaction instead of data

    const data: IBlock["data"] = { amount: 1 };
    const nonce: number = 0;
    const timestamp: number = new Date().getTime();
    const difficulty: number = config.DIFFICULTY;
    const previousHash: string = "-";
    const hash: string = Block.generateHash({
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });

    return new Block({
      hash,
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });
  }

  static calculateDifficulty(input: {
    previousBlock: IBlock;
    timestamp: number;
  }): number {
    const { previousBlock, timestamp } = input;
    let result: number = previousBlock.difficulty;

    if (previousBlock.timestamp + config.MINE_RATE > timestamp) {
      result += 1;
    } else {
      result -= 1;
    }

    if (result < config.MIN_DIFFICULTY) {
      result = config.MIN_DIFFICULTY;
    }

    return result;
  }

  static generateHash(input: IBlockBase): string {
    return utils.generateHash(input);
  }
}
