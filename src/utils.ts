import SHA256 from "crypto-js/sha256";
import { v4 as uuid } from "uuid";

export function generateHash(input: Record<string, any>): string {
  let result: string = "";
  for (let i in input) {
    result += JSON.stringify(input[i]);
  }

  return SHA256(result).toString();
}

export function generateUUID(): string {
  return uuid();
}
