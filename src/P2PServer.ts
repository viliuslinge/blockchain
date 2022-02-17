import { WebSocket, Server, MessageEvent } from "ws";

import { Blockchain } from "./Blockchain";
import { Transaction, ITransaction } from "./Transaction";
import { TransactionPool } from "./TransactionPool";
import { Block, IBlock } from "./Block";

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
    this.server = new WebSocket.Server({
      port: Number(P2PSERVER_PORT),
    });
  }

  listen() {
    this.server.on("connection", (ws) => this.connectSocket(ws));
    this.connectToPeers();

    console.log(
      `[P2P server] listening por P2P connetions on ${P2PSERVER_PORT} port`
    );
  }

  connectSocket(socket: WebSocket) {
    this.sockets.push(socket);
    console.log(`[P2P server] socket connected`);

    this.initMessageHandler(socket);
    this.sendBlocks(socket);
  }

  connectToPeers() {
    peers.forEach((it) => {
      const socket: WebSocket = new WebSocket(it);
      socket.on("open", () => {
        this.connectSocket(socket);
      });
    });
  }

  initMessageHandler(socket: WebSocket) {
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
          this.transactionPool.addOrUpdate(
            new Transaction(event.data.transaction)
          );
          break;
        }
        case IMessageType.ClearAllTransactions: {
          this.transactionPool.clear();
          break;
        }
        default: {
          throw new Error(
            `[P2P server] unknown message type ${JSON.stringify(event)}`
          );
        }
      }
    });
  }

  sendBlocks(socket: WebSocket) {
    this.sendMessage(socket, {
      type: IMessageType.SendBlocks,
      data: {
        blocks: this.blockchain.blocks.map((it) => it.serialize()),
      },
    });
  }

  sendTransaction(socket: WebSocket, transaction: Transaction) {
    this.sendMessage(socket, {
      type: IMessageType.SendTransaction,
      data: {
        transaction: transaction.serialize(),
      },
    });
  }

  clearAllTransactions(socket: WebSocket) {
    this.sendMessage(socket, {
      type: IMessageType.ClearAllTransactions,
      data: null,
    });
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

  private sendMessage(socket: WebSocket, message: IMessage) {
    socket.send(JSON.stringify(message));
  }
}
