const config = {
  MIN_DIFFICULTY: 1,
  DIFFICULTY: 2,
  MINE_RATE: 2,
  HASH_PREFIX: "0",
};

import * as utils from "./utils";

interface IBlock extends IBlockBase {
  hash: string;
}

interface IBlockBase {
  data: IBlockData;
  nonce: number;
  timestamp: number;
  difficulty: number;
  previousHash: string;
}

interface IBlockData {
  amount: number;
}

export class Block implements IBlock {
  hash: IBlock["hash"];
  data: IBlock["data"];
  nonce: IBlock["nonce"];
  timestamp: IBlock["timestamp"];
  difficulty: IBlock["difficulty"];
  previousHash: IBlock["previousHash"];

  constructor(input: IBlock) {
    this.hash = input.hash;
    this.data = input.data;
    this.nonce = input.nonce;
    this.timestamp = input.timestamp;
    this.difficulty = input.difficulty;
    this.previousHash = input.previousHash;
  }

  static createGenesisBlock(): Block {
    // TODO: implement transaction instead of data

    return new Block({
      hash: "0",
      data: { amount: 1 },
      nonce: 0,
      timestamp: 0,
      difficulty: config.DIFFICULTY,
      previousHash: "-",
    });
  }

  static mineBlock(input: {
    previousBlock: IBlock;
    data: IBlock["data"];
  }): Block {
    const { previousBlock, data } = input;

    const previousHash: IBlock["previousHash"] = previousBlock.hash;
    let timestamp: IBlock["timestamp"] = new Date().getTime();
    let nonce: IBlock["nonce"] = 0;
    let difficulty: IBlock["difficulty"] = Block.calculateDifficulty({
      previousBlock,
      timestamp,
    });
    let hash: IBlock["hash"] = generateHash();

    while (
      config.HASH_PREFIX.repeat(difficulty) !== hash.substring(0, difficulty)
    ) {
      timestamp = new Date().getTime();
      nonce += 1;
      difficulty = Block.calculateDifficulty({ previousBlock, timestamp });
      hash = generateHash();
    }

    return new Block({
      hash,
      data,
      nonce,
      timestamp,
      difficulty,
      previousHash,
    });

    function generateHash() {
      return Block.generateHash({
        data,
        nonce,
        timestamp,
        difficulty,
        previousHash,
      });
    }
  }

  static generateHash(input: IBlockBase): IBlock["hash"] {
    return utils.generateHash(input);
  }

  static calculateDifficulty(input: {
    previousBlock: IBlock;
    timestamp: IBlock["timestamp"];
  }): IBlock["difficulty"] {
    const { previousBlock, timestamp } = input;
    let result: IBlock["difficulty"] = previousBlock.difficulty;

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
}
