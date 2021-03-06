import { WebSocket, Server } from "ws";

import { IBlock, Block, Blockchain } from "./core";
import { Transaction, ITransaction } from "./Transaction";
import { TransactionPool } from "./TransactionPool";

const P2PSERVER_PORT: string = process.env.P2PSERVER_PORT || "5001";
const peers: string[] = process.env.PEERS ? process.env.PEERS.split(",") : [];

type IMessage =
  | IMessageChainSent
  | IMessageTransactionSent
  | IMessageTransactionsCleared;

interface IMessageChainSent extends IMessageBase {
  type: IMessageType.SendBlocks;
  data: {
    blocks: IBlock[];
  };
}

interface IMessageTransactionSent extends IMessageBase {
  type: IMessageType.SendTransaction;
  data: {
    transaction: ITransaction;
  };
}

interface IMessageTransactionsCleared extends IMessageBase {
  type: IMessageType.ClearAllTransactions;
  data: null;
}

interface IMessageBase {
  type: IMessageType;
}

enum IMessageType {
  SendBlocks = "send-blocks",
  SendTransaction = "send-transaction",
  ClearAllTransactions = "clear-all-transactions",
}

export class P2PServer {
  readonly server: Server;
  blockchain: Blockchain;
  transactionPool: TransactionPool;
  sockets: WebSocket[];

  constructor(input: {
    blockchain: Blockchain;
    transactionPool: TransactionPool;
  }) {
    this.blockchain = input.blockchain;
    this.transactionPool = input.transactionPool;
    this.sockets = [];
    this.server = new WebSocket.Server({
      port: Number(P2PSERVER_PORT),
    });
  }

  listen() {
    this.server.on("connection", (ws) => this.connectSocket(ws));
    this.connectToPeers();

    console.log(
      `[P2P_SERVER] listening for P2P connections on port ${P2PSERVER_PORT}`
    );
  }

  broadcastBlocks() {
    this.sockets.forEach((it) => {
      this.sendBlocks(it);
    });
  }

  broadcastTransaction(transaction: Transaction) {
    this.sockets.forEach((it) => {
      this.sendTransaction(it, transaction);
    });
  }

  broadcastCleatTransactions() {
    this.sockets.forEach((it) => {
      this.clearAllTransactions(it);
    });
  }

  private connectSocket(socket: WebSocket) {
    this.sockets.push(socket);
    console.log(`[P2P_SERVER] socket connected`);

    this.initMessageHandler(socket);
    this.sendBlocks(socket);
  }

  private connectToPeers() {
    peers.forEach((it) => {
      const socket: WebSocket = new WebSocket(it);
      socket.on("open", () => {
        this.connectSocket(socket);
      });
    });
  }

  private initMessageHandler(socket: WebSocket) {
    socket.on("message", (data) => {
      const event: IMessage = JSON.parse(data.toString());

      switch (event.type) {
        case IMessageType.SendBlocks: {
          this.blockchain.resetChain(
            event.data.blocks.map((it) => new Block(it))
          );
          break;
        }
        case IMessageType.SendTransaction: {
          this.transactionPool.addOrUpdateTransaction(
            new Transaction(event.data.transaction)
          );
          break;
        }
        case IMessageType.ClearAllTransactions: {
          this.transactionPool.clearPool();
          break;
        }
        default: {
          throw new Error(
            `[P2P_SERVER] unknown message type ${JSON.stringify(event)}`
          );
        }
      }
    });
  }

  private sendBlocks(socket: WebSocket) {
    this.sendMessage(socket, {
      type: IMessageType.SendBlocks,
      data: {
        blocks: this.blockchain.blocks.map((it) => it.serialize()),
      },
    });
  }

  private sendTransaction(socket: WebSocket, transaction: Transaction) {
    this.sendMessage(socket, {
      type: IMessageType.SendTransaction,
      data: {
        transaction: transaction.serialize(),
      },
    });
  }

  private clearAllTransactions(socket: WebSocket) {
    this.sendMessage(socket, {
      type: IMessageType.ClearAllTransactions,
      data: null,
    });
  }

  private sendMessage(socket: WebSocket, message: IMessage) {
    socket.send(JSON.stringify(message));
  }
}
