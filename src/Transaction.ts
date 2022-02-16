import * as config from "./config";
import * as utils from "./utils";
import { Wallet } from "./Wallet";

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

  constructor(input?: { id?: string }) {
    this.id = input?.id ?? utils.generateUUID();
    this.outputs = [];
  }

  static withOutput(input: {
    senderWallet: Wallet;
    outputs: ITransactionOutput[];
  }): Transaction {
    const { senderWallet, outputs } = input;
    const transaction: Transaction = new Transaction();

    outputs.forEach((it) => transaction.addOutput(it));
    Transaction.sign({ senderWallet, transaction });

    return transaction;
  }

  static create(input: {
    senderWallet: Wallet;
    recipientAddress: string;
    amount: number;
  }): Transaction {
    const { senderWallet, recipientAddress, amount } = input;

    if (amount > senderWallet.balance) {
      throw new RangeError(
        `[Transaction] amount ${amount} exceeds balance ${senderWallet.balance}`
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

    return Transaction.withOutput({ senderWallet, outputs });
  }

  static createReward(input: {
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

    return Transaction.withOutput({ senderWallet: blockchainWallet, outputs });
  }

  static sign(input: { senderWallet: Wallet; transaction: Transaction }) {
    const { senderWallet, transaction } = input;

    transaction.setInput({
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      timestamp: new Date().getTime(),
      signature: senderWallet.sign(utils.generateHash(transaction.outputs)),
    });
  }

  static verify(transaction: Transaction): boolean {
    if (!transaction.input) {
      throw new Error(`[Transaction] missing input`);
    }

    return utils.verifySignature({
      publicKey: transaction.input.address,
      signature: transaction.input.signature,
      expectedHash: utils.generateHash(transaction.outputs),
    });
  }

  setInput(input: ITransactionInput) {
    this.input = input;
  }

  addOutput(output: ITransactionOutput) {
    this.outputs.push(output);
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
        `[Transaction] amount ${amount} exceeds balance ${senderTransactionOuput.amount}`
      );
    }

    senderTransactionOuput.amount -= amount;

    this.addOutput({
      amount: amount,
      address: recipientAddress,
    });

    Transaction.sign({ senderWallet, transaction: this });
  }
}
