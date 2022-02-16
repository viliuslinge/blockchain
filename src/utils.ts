import SHA256 from "crypto-js/sha256";
import { v4 as uuid } from "uuid";
import { ec as EC } from "elliptic";

import { IKeyPair, ISignature } from "./types";

const ec = new EC("secp256k1");

export function generateHash(input: any): string {
  return SHA256(JSON.stringify(input)).toString();
}

export function generateUUID(): string {
  return uuid();
}

export function generateKeyPair(): IKeyPair {
  return ec.genKeyPair();
}

export function verifySignature(input: {
  publicKey: string;
  signature: string;
  expectedHash: string;
}): boolean {
  const { publicKey, signature, expectedHash } = input;

  try {
    return ec.keyFromPublic(publicKey, "hex").verify(expectedHash, signature);
  } catch (err) {
    console.error(
      `[Signature] unsuccessful verification for public key ${publicKey}`,
      err
    );
    return false;
  }
}
