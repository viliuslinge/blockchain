import SHA256 from "crypto-js/sha256";

import { IBlockData } from "./types";

export function calculateHash(input: Record<string, any>): string {
  let message: string = "";

  for (let i in input) {
    message = message + JSON.stringify(input[i]);
  }

  return SHA256(message).toString();
}
