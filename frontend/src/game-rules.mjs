import { parseEther } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111n;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function isSepoliaChain(chainId) {
  try {
    return BigInt(chainId) === SEPOLIA_CHAIN_ID;
  } catch {
    return false;
  }
}

export function getPlayerRole(account, playerA, playerB) {
  if (!account) return null;

  const normalized = account.toLowerCase();
  const addressA = playerA?.toLowerCase();
  const addressB = playerB?.toLowerCase();

  if (addressA && addressA !== ZERO_ADDRESS && normalized === addressA) return "A";
  if (addressB && addressB !== ZERO_ADDRESS && normalized === addressB) return "B";
  return null;
}

export function getCommitValue(mode, enteredAmount, contractStake) {
  if (mode === "join") return BigInt(contractStake);
  if (mode === "create") return parseEther(String(enteredAmount));
  throw new RangeError("Acción de compromiso desconocida.");
}

export function canClaimByTimeout(phase, blockTime, joinDeadline, revealDeadline) {
  const currentTime = Number(blockTime);
  if (Number(phase) === 0) {
    const deadline = Number(joinDeadline);
    return deadline > 0 && currentTime > deadline;
  }
  if (Number(phase) === 1) {
    const deadline = Number(revealDeadline);
    return deadline > 0 && currentTime > deadline;
  }
  return false;
}
