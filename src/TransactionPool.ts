import { Transaction } from "./Transaction";

export class TransactionPool {
  transactions: Transaction[];

  constructor() {
    this.transactions = [];
  }

  clearPool() {
    this.transactions = [];
  }

  findTransaction(address: string): Transaction | undefined {
    return this.transactions.find((it) => {
      return it.input?.address === address;
    });
  }

  addOrUpdateTransaction(transaction: Transaction) {
    const index = this.transactions.findIndex((it) => {
      return it.id === transaction.id;
    });

    if (index >= 0) {
      this.transactions[index] = transaction;
    } else {
      this.transactions.push(transaction);
    }
  }

  get validTransactions(): Transaction[] {
    const result: Transaction[] = [];

    this.transactions.forEach((it) => {
      if (!it.input) {
        console.error(
          `[TRANSACTION_POOL] invalid transaction. Missing input address`
        );
        return;
      }

      const startBalance: number = it.input.amount;
      let outputBalance: number = 0;

      it.outputs.forEach((it) => {
        outputBalance += it.amount;
      });

      if (startBalance !== outputBalance) {
        console.error(
          `[TRANSACTION_POOL] invalid transaction (balance) from address ${it.input.address}`
        );
        return;
      }

      if (!Transaction.verifyTransaction(it)) {
        console.error(
          `[TRANSACTION_POOL] invalid transaction (signature) from address ${it.input.address}`
        );
        return;
      }

      result.push(it);
    });

    return result;
  }
}
