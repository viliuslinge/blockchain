import * as config from "./config";
import * as utils from "./utils";
import { IKeyPair } from "./types";
import { Blockchain } from "./Blockchain";
import { Transaction } from "./Transaction";
import { TransactionPool } from "./TransactionPool";
import { Block } from "./Block";

export class Wallet {
  private static blockchainWallet: Wallet;

  keyPair: IKeyPair;
  publicKey: string;
  balance: number;
  lastBlockTimestamp: number;
  lastBlockBalanceCalcTime: number;

  constructor() {
    this.keyPair = utils.generateKeyPair();
    this.balance = config.INITIAL_BALANCE;
    this.publicKey = this.keyPair.getPublic().encode("hex", true);
    this.lastBlockTimestamp = 0;
    this.lastBlockBalanceCalcTime = 0;
  }

  static getBlockchainWallet(): Wallet {
    if (!Wallet.blockchainWallet) {
      Wallet.blockchainWallet = new Wallet();
      Wallet.blockchainWallet.publicKey = config.BLOCKCHAIN_WALLET_ADDRESS;
    }

    return Wallet.blockchainWallet;
  }

  calculateBalance(blockchain: Blockchain): number {
    if (!blockchain.latestBlock) {
      throw new Error(
        `[Wallet] cannot calculate balance. Missing latest block`
      );
    }

    this.lastBlockTimestamp = blockchain.latestBlock.timestamp;

    const newTransactions: Transaction[] = [];
    let balance: number = this.balance;

    if (this.lastBlockBalanceCalcTime === this.lastBlockTimestamp) {
      if (this.lastBlockBalanceCalcTime > 0) {
        return balance;
      }
    }

    const blocks: Block[] = blockchain.blocks;
    let startBlockIdx: number = 0;

    for (let i = blocks.length - 1; i >= 0; i--) {
      if (blocks[i].timestamp === this.lastBlockBalanceCalcTime) {
        startBlockIdx = i + 1;
        break;
      }
    }

    for (let i = startBlockIdx; i < blocks.length; i++) {
      const transactions: Transaction[] = blocks[i].data;

      for (let j = 0; j < transactions.length; j++) {
        newTransactions.push(transactions[j]);
      }
    }

    const withdrawalTransactions: Transaction[] = newTransactions.filter(
      (it) => {
        return it.input?.address && it.input.address === this.publicKey;
      }
    );

    const depositTransactions: Transaction[] = newTransactions.filter((it) => {
      for (let i = 1; i < it.outputs.length; i++) {
        if (it.outputs[i].address === this.publicKey) {
          if (it.input?.address && it.input.address !== this.publicKey) {
            return true;
          }
        }
      }

      return false;
    });

    for (let i = 0; i < withdrawalTransactions.length; i++) {
      for (let j = 1; j < withdrawalTransactions[i].outputs.length; j++) {
        balance -= withdrawalTransactions[i].outputs[j].amount;
      }
    }

    for (let i = 0; i < depositTransactions.length; i++) {
      for (let j = 1; j < depositTransactions[i].outputs.length; j++) {
        if (depositTransactions[i].outputs[j].address === this.publicKey) {
          balance += depositTransactions[i].outputs[j].amount;
        }
      }
    }

    this.lastBlockBalanceCalcTime = this.lastBlockTimestamp;
    this.balance = balance;

    return balance;
  }

  createOrUpdateTransaction(input: {
    recipientAddress: string;
    amount: number;
    blockchain: Blockchain;
    transactionPool: TransactionPool;
  }) {
    const { recipientAddress, amount, blockchain, transactionPool } = input;

    this.balance = this.calculateBalance(blockchain);

    if (amount > this.balance) {
      throw new RangeError(
        `[Wallet] amount ${amount} exceeds balance ${this.balance}`
      );
    }

    let transaction: Transaction | undefined = transactionPool.find(
      this.publicKey
    );

    if (transaction) {
      transaction.update({ senderWallet: this, recipientAddress, amount });
    } else {
      transaction = Transaction.create({
        senderWallet: this,
        recipientAddress,
        amount,
      });
      transactionPool.addOrUpdate(transaction);
    }

    return transaction;
  }

  sign(hash: string): string {
    return this.keyPair.sign(hash).toDER("hex");
  }
}
