import cloneDeep from "lodash/cloneDeep";

import * as utils from "../utils";
import * as config from "../config";

export interface IBlock extends IBlockBase {
  hash: string;
}

interface IBlockBase {
  data: any;
  nonce: number;
  timestamp: number;
  difficulty: number;
  previousHash: string;
}

export class Block implements IBlock {
  hash: string;
  data: any;
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

  static mineBlock(input: { previousBlock: IBlock; data: any }): Block {
    const { previousBlock, data } = input;
    const previousHash: string = previousBlock.hash;
    let timestamp: number = new Date().getTime();
    let nonce: number = 0;
    let difficulty: number = previousBlock.difficulty;
    let hash: string = Block.generateHash({
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });

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

    return new Block({
      hash,
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });
  }

  static generateGenesisBlock(input: { data: any }): Block {
    const { data } = input;
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

    if (previousBlock.timestamp + config.MINING_RATE > timestamp) {
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

  serialize(): IBlock {
    return cloneDeep({
      hash: this.hash,
      data: this.data,
      nonce: this.nonce,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      previousHash: this.previousHash,
    });
  }
}
