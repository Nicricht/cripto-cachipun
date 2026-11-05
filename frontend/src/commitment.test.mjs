import assert from "node:assert/strict";
import test from "node:test";
import { solidityPackedKeccak256 } from "ethers";
import {
  clearSecret,
  createCommitment,
  createSecret,
  loadSecret,
  saveSecret,
  secretStorageKey,
} from "./commitment.mjs";

const secret = `0x${"11".repeat(32)}`;
const account = "0x053911b53dA16Ddd46cda6CB28b6E3969fE7de55";
const contractAddress = "0xfb96470312fAA99Cf63186328a5a7e796458c04A";

test("createCommitment uses Solidity's packed uint8, bytes32, address order", () => {
  const expected = solidityPackedKeccak256(
    ["uint8", "bytes32", "address"],
    [1, secret, account],
  );

  assert.equal(createCommitment(1, secret, account), expected);
});

test("createCommitment rejects Ninguna and unknown moves", () => {
  assert.throws(() => createCommitment(0, secret, account), /jugada/i);
  assert.throws(() => createCommitment(4, secret, account), /jugada/i);
});

test("createSecret returns a random bytes32 value", () => {
  const first = createSecret();
  const second = createSecret();

  assert.match(first, /^0x[0-9a-f]{64}$/i);
  assert.match(second, /^0x[0-9a-f]{64}$/i);
  assert.notEqual(first, second);
});

test("secretStorageKey is scoped to contract and normalized account", () => {
  const key = secretStorageKey(contractAddress, account.toLowerCase());

  assert.equal(
    key,
    `cripto-cachipun:secret:${contractAddress.toLowerCase()}:${account.toLowerCase()}`,
  );
});

test("saved reveal material survives a read and can be cleared", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const key = secretStorageKey(contractAddress, account);
  const reveal = { move: 1, secret, createdAt: 1_794_000_000 };

  saveSecret(storage, key, reveal);
  assert.deepEqual(loadSecret(storage, key), reveal);

  clearSecret(storage, key);
  assert.equal(loadSecret(storage, key), null);
});

test("loadSecret ignores malformed stored values", () => {
  const storage = { getItem: () => "{not-json" };

  assert.equal(loadSecret(storage, "broken"), null);
});
