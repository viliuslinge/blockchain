import cloneDeep from "lodash/cloneDeep";

import * as config from "./config";
import * as utils from "./utils";
import { Wallet } from "./Wallet";

export interface ITransaction {
  id: string;
  input?: ITransactionInput;
  outputs: ITransactionOutput[];
}

interface ITransactionInput {
  amount: number;
  address: string;
  timestamp: number;
  signature: string;
}

interface ITransactionOutput {
  amount: number;
  address: string;
}

export class Transaction {
  id: string;
  input?: ITransactionInput;
  outputs: ITransactionOutput[];

  constructor(input?: Partial<ITransaction>) {
    this.id = input?.id ?? utils.generateUUID();
    this.input = input?.input;
    this.outputs = input?.outputs ?? [];
  }

  static transactionWithOutput(input: {
    senderWallet: Wallet;
    outputs: ITransactionOutput[];
  }): Transaction {
    const { senderWallet, outputs } = input;
    const transaction: Transaction = new Transaction();

    outputs.forEach((it) => transaction.addOutput(it));
    Transaction.signTransaction({ senderWallet, transaction });

    return transaction;
  }

  static createTransaction(input: {
    senderWallet: Wallet;
    recipientAddress: string;
    amount: number;
  }): Transaction {
    const { senderWallet, recipientAddress, amount } = input;

    if (amount > senderWallet.balance) {
      throw new RangeError(
        `[TRANSACTION] amount ${amount} exceeds balance ${senderWallet.balance}`
      );
    }

    const outputs: ITransactionOutput[] = [
      {
        amount: senderWallet.balance - amount,
        address: senderWallet.publicKey,
      },
      {
        amount: amount,
        address: recipientAddress,
      },
    ];

    return Transaction.transactionWithOutput({ senderWallet, outputs });
  }

  static createRewardTransaction(input: {
    minerWallet: Wallet;
    blockchainWallet: Wallet;
  }): Transaction {
    const { minerWallet, blockchainWallet } = input;

    const outputs: ITransactionOutput[] = [
      {
        amount: 9999999,
        address: config.BLOCKCHAIN_WALLET_ADDRESS,
      },
      {
        amount: config.MINING_REWARD,
        address: minerWallet.publicKey,
      },
    ];

    return Transaction.transactionWithOutput({
      senderWallet: blockchainWallet,
      outputs,
    });
  }

  static signTransaction(input: {
    senderWallet: Wallet;
    transaction: Transaction;
  }) {
    const { senderWallet, transaction } = input;

    transaction.setInput({
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      timestamp: new Date().getTime(),
      signature: senderWallet.sign(utils.generateHash(transaction.outputs)),
    });
  }

  static verifyTransaction(transaction: Transaction): boolean {
    if (!transaction.input) {
      throw new Error(`[TRANSACTION] missing input`);
    }

    return utils.verifySignature({
      publicKey: transaction.input.address,
      signature: transaction.input.signature,
      expectedHash: utils.generateHash(transaction.outputs),
    });
  }

  update(input: {
    senderWallet: Wallet;
    recipientAddress: string;
    amount: number;
  }) {
    const { senderWallet, recipientAddress, amount } = input;

    const senderTransactionOuput: ITransactionOutput | undefined =
      this.outputs.find((it) => {
        return it.address === senderWallet.publicKey;
      });
    if (!senderTransactionOuput) return;

    if (amount > senderTransactionOuput.amount) {
      throw new RangeError(
        `[TRANSACTION] amount ${amount} exceeds balance ${senderTransactionOuput.amount}`
      );
    }

    senderTransactionOuput.amount -= amount;

    this.addOutput({
      amount: amount,
      address: recipientAddress,
    });

    Transaction.signTransaction({ senderWallet, transaction: this });
  }

  serialize(): ITransaction {
    return cloneDeep({
      id: this.id,
      input: this.input,
      outputs: this.outputs,
    });
  }

  private setInput(input: ITransactionInput) {
    this.input = input;
  }

  private addOutput(output: ITransactionOutput) {
    this.outputs.push(output);
  }
}
