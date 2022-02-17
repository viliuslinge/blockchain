const nodeFetch = require("node-fetch");

// import { Blockchain } from "./Blockchain";
// import { Transaction } from "./Transaction";
// import { Block } from "./Block";

// const genesisBlockData: Transaction = new Transaction({ id: "genesis" });
// genesisBlockData.setInput({
//   amount: 0,
//   address: "-",
//   timestamp: new Date().getTime(),
//   signature: "-",
// });

// const blockchain = new Blockchain({
//   genesisBlock: Block.generateGenesisBlock({ data: genesisBlockData }),
// });

// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });
// blockchain.addBlock({
//   amount: 1,
// });

function main() {
  nodeFetch("http://localhost:3001/mine-transactions", {
    method: "GET",
  })
    .then((res) => res.json())
    .then((body) => console.log("WORKS: ", JSON.stringify(body, null, 3)))
    .catch((err) => console.log("FUCK: ", err));
}

main();
