import assert from "node:assert/strict";
import test from "node:test";
import {
  canClaimByTimeout,
  getCommitValue,
  getPlayerRole,
  isSepoliaChain,
} from "./game-rules.mjs";

const playerA = "0x053911b53dA16Ddd46cda6CB28b6E3969fE7de55";
const playerB = "0x1234567890123456789012345678901234567890";
const empty = "0x0000000000000000000000000000000000000000";

test("writes are permitted only on Sepolia", () => {
  assert.equal(isSepoliaChain(11155111n), true);
  assert.equal(isSepoliaChain("0xaa36a7"), true);
  assert.equal(isSepoliaChain(1n), false);
  assert.equal(isSepoliaChain("not-a-chain"), false);
});

test("a player cannot be treated as the opponent using the same address", () => {
  assert.equal(getPlayerRole(playerA, playerA, empty), "A");
  assert.equal(getPlayerRole(playerA, playerA, playerB), "A");
  assert.equal(getPlayerRole(playerB, playerA, playerB), "B");
  assert.equal(getPlayerRole("0x9999999999999999999999999999999999999999", playerA, empty), null);
});

test("joining always uses the exact on-chain stake", () => {
  assert.equal(getCommitValue("join", "9.9", 1000000000000000n), 1000000000000000n);
});

test("claim is unavailable at the deadline and available only after it", () => {
  assert.equal(canClaimByTimeout(0, 100, 100, 0), false);
  assert.equal(canClaimByTimeout(0, 101, 100, 0), true);
  assert.equal(canClaimByTimeout(1, 200, 100, 200), false);
  assert.equal(canClaimByTimeout(1, 201, 100, 200), true);
  assert.equal(canClaimByTimeout(2, 999, 100, 200), false);
});
