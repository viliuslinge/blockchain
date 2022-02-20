import express from "express";
import * as bodyParser from "body-parser";

import { Block, Blockchain } from "./core";
import { Transaction } from "./Transaction";
import { Miner } from "./Miner";
import { Wallet } from "./Wallet";
import { P2PServer } from "./P2PServer";
import { TransactionPool } from "./TransactionPool";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";

const app = express();
const blockchain = new Blockchain({
  genesisBlock: Block.generateGenesisBlock({
    data: new Transaction({
      id: "genesis",
      input: {
        amount: 0,
        address: "-",
        timestamp: new Date().getTime(),
        signature: "-",
      },
    }),
  }),
});
const wallet = new Wallet();
const transactionPool = new TransactionPool();
const p2pServer = new P2PServer({ blockchain, transactionPool });
const miner = new Miner({
  blockchain,
  transactionPool,
  wallet,
  server: p2pServer,
});

app.use(bodyParser.json());

const ENDPOINT_BALANCE = "/balance";
const ENDPOINT_BLOCKS = "/blocks";
const ENDPOINT_PUBLIC_KEY = "/public-key";
const ENDPOINT_TRANSACTIONS = "/transactions";
const ENDPOINT_MINE = "/mine";
const ENDPOINT_MINE_TRANSACTIONS = "/mine-transactions";

app.get(ENDPOINT_BALANCE, (_req, res) => {
  res.json({
    balance: wallet.calculateBalance(blockchain),
  });
});

app.get(ENDPOINT_BLOCKS, (_req, res) => {
  res.json({
    blocks: blockchain.blocks,
  });
});

app.get(ENDPOINT_PUBLIC_KEY, (_req, res) => {
  res.json({
    publicKey: wallet.publicKey,
  });
});

app.get(ENDPOINT_TRANSACTIONS, (_req, res) => {
  res.json({
    transactions: transactionPool.transactions,
  });
});

app.post(ENDPOINT_TRANSACTIONS, (req, res) => {
  const recipientAddress: string = req.body.recipientAddress;
  const amount: number = req.body.amount;
  const transaction: Transaction = wallet.createOrUpdateTransaction({
    recipientAddress,
    amount,
    blockchain,
    transactionPool,
  });

  p2pServer.broadcastTransaction(transaction);

  res.redirect(ENDPOINT_TRANSACTIONS);
});

app.get(ENDPOINT_MINE_TRANSACTIONS, (_req, res) => {
  const block: Block | undefined = miner.mine();
  if (!block) return;

  res.redirect(ENDPOINT_BLOCKS);
});

app.post(ENDPOINT_MINE, (req, res) => {
  const block: Block | undefined = blockchain.addBlock(req.body.data);
  if (!block) return;

  p2pServer.broadcastBlocks();

  res.redirect(ENDPOINT_BLOCKS);
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP_SERVER] listening on port ${HTTP_PORT}`);
});

p2pServer.listen();
