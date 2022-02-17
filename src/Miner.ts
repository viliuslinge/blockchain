import { Block } from "./Block";
import { Blockchain } from "./Blockchain";
import { Transaction } from "./Transaction";
import { TransactionPool } from "./TransactionPool";
import { Wallet } from "./Wallet";
import { P2PServer } from "./P2PServer";

export class Miner {
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  wallet: Wallet;
  server: P2PServer;

  constructor(input: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
    wallet: Wallet;
    server: P2PServer;
  }) {
    this.blockchain = input.blockchain;
    this.transactionPool = input.transactionPool;
    this.wallet = input.wallet;
    this.server = input.server;
  }

  mine(): Block | undefined {
    const validTransactions: Transaction[] = [
      ...this.transactionPool.validTransactions,
    ];

    validTransactions.push(
      Transaction.createReward({
        minerWallet: this.wallet,
        blockchainWallet: Wallet.getBlockchainWallet(),
      })
    );

    const block: Block | undefined =
      this.blockchain.addBlock(validTransactions);
    if (!block) return;

    this.server.broadcastBlocks();
    this.transactionPool.clear();
    this.server.broadcastCleatTransactions();

    return block;
  }
}
