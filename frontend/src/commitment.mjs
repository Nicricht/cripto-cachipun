import {
  getAddress,
  hexlify,
  isHexString,
  randomBytes,
  solidityPackedKeccak256,
} from "ethers";

export function createSecret() {
  return hexlify(randomBytes(32));
}

export function createCommitment(move, secret, account) {
  const normalizedMove = Number(move);

  if (!Number.isInteger(normalizedMove) || normalizedMove < 1 || normalizedMove > 3) {
    throw new RangeError("La jugada debe ser Piedra (1), Papel (2) o Tijera (3).");
  }

  if (!isHexString(secret, 32)) {
    throw new TypeError("El secreto debe contener exactamente 32 bytes.");
  }

  const normalizedAccount = getAddress(account);

  return solidityPackedKeccak256(
    ["uint8", "bytes32", "address"],
    [normalizedMove, secret, normalizedAccount],
  );
}

export function secretStorageKey(contractAddress, account) {
  const contract = getAddress(contractAddress).toLowerCase();
  const player = getAddress(account).toLowerCase();

  return `cripto-cachipun:secret:${contract}:${player}`;
}

export function saveSecret(storage, key, value) {
  if (!storage || typeof storage.setItem !== "function") {
    throw new TypeError("El almacenamiento local no está disponible.");
  }

  storage.setItem(key, JSON.stringify(value));
}

export function loadSecret(storage, key) {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;

    const value = JSON.parse(raw);
    const move = Number(value?.move);

    if (
      !Number.isInteger(move) ||
      move < 1 ||
      move > 3 ||
      !isHexString(value?.secret, 32)
    ) {
      return null;
    }

    return { ...value, move };
  } catch {
    return null;
  }
}

export function clearSecret(storage, key) {
  storage?.removeItem(key);
}
