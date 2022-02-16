import { Transaction } from "./Transaction";

export class TransactionPool {
  transactions: Transaction[];

  constructor() {
    this.transactions = [];
  }

  clear() {
    this.transactions = [];
  }

  find(address: string): Transaction | undefined {
    return this.transactions.find((it) => {
      return it.input?.address === address;
    });
  }

  addOrUpdate(transaction: Transaction) {
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
          `[Transaction pool] invalid transaction. Missing input address`
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
          `[Transaction pool] invalid transaction (balance) from address ${it.input.address}`
        );
        return;
      }

      if (!Transaction.verify(it)) {
        console.error(
          `[Transaction pool] invalid transaction (signature) from address ${it.input.address}`
        );
        return;
      }

      result.push(it);
    });

    return result;
  }
}
