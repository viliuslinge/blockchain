import express from "express";
import * as bodyParser from "body-parser";

import { Block } from "./Block";
import { Blockchain } from "./Blockchain";
import { Transaction } from "./Transaction";
import { Miner } from "./Miner";
import { Wallet } from "./Wallet";
import { P2PServer } from "./P2PServer";
import { TransactionPool } from "./TransactionPool";

const HTTP_PORT: string = process.env.HTTP_PORT || "3001";
const app = express();
const genesisBlockData: Transaction = new Transaction({ id: "genesis" });
genesisBlockData.setInput({
  amount: 0,
  address: "-",
  timestamp: new Date().getTime(),
  signature: "-",
});
const blockchain: Blockchain = new Blockchain({
  genesisBlock: Block.generateGenesisBlock({ data: genesisBlockData }),
});
const wallet: Wallet = new Wallet();
const transactionPool: TransactionPool = new TransactionPool();
const p2pServer: P2PServer = new P2PServer({ blockchain, transactionPool });
const miner: Miner = new Miner({
  blockchain,
  transactionPool,
  wallet,
  server: p2pServer,
});

app.use(bodyParser.json());

app.get("/balance", (_req, res) => {
  res.json({
    balance: wallet.calculateBalance(blockchain),
  });
});

app.get("/blocks", (_req, res) => {
  res.json({
    blocks: blockchain.blocks,
  });
});

app.get("/public-key", (_req, res) => {
  res.json({
    publicKey: wallet.publicKey,
  });
});

app.get("/transactions", (_req, res) => {
  res.json({
    transactions: transactionPool.transactions,
  });
});

app.post("/transactions", (req, res) => {
  const recipientAddress: string = req.body.recipientAddress;
  const amount: number = req.body.amount;
  const transaction: Transaction = wallet.createOrUpdateTransaction({
    recipientAddress,
    amount,
    blockchain,
    transactionPool,
  });

  p2pServer.broadcastTransaction(transaction);

  res.redirect("/transactions");
});

app.get("/mine-transactions", (_req, res) => {
  const block: Block | undefined = miner.mine();
  if (!block) return;

  res.redirect("/blocks");
});

app.post("/mine", (req, res) => {
  const block: Block | undefined = blockchain.addBlock(req.body.data);
  if (!block) return;

  p2pServer.broadcastBlocks();

  res.redirect("/blocks");
});

app.listen(HTTP_PORT, () => {
  console.log(`[Server] listening on port ${HTTP_PORT}`);
});

p2pServer.listen();
