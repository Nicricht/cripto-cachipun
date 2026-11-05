# Sepolia Browser Frontend Implementation Plan

> **For agentic workers:** Execute tasks in order with TDD. The isolated GitHub branch is `feat/sepolia-web-dapp`; do not write to `main`.

**Goal:** Add a browser dapp that lets two MetaMask accounts play the already deployed Cripto Cachipún contract on Sepolia.

**Architecture:** Vite serves a small vanilla JavaScript SPA. Ethers v6 handles MetaMask, read calls and transactions. A separate helper module creates Solidity-compatible commitments and persists each account's reveal secret locally.

**Tech Stack:** Node 20, Vite 6, ethers 6, native Node test runner, existing Hardhat 2/Solidity 0.8.24.

**Spec:** `docs/superpowers/specs/2026-11-05-sepolia-browser-frontend-design.md`

## Global Constraints
- Only chain ID 11155111 and contract `0xfb96470312fAA99Cf63186328a5a7e796458c04A`.
- Do not deploy or modify the Solidity contract.
- Do not use real ETH, private keys or seed phrases.
- Keep `main` unchanged; deliver a DRAFT pull request.
- Existing nine Hardhat tests are historical baseline; do not add repeated contract tests.

## Review Focus
- Wrong chain selected: every write must be blocked until MetaMask is on Sepolia.
- Player A attempts to join as Player B: UI must explain that a second address is required.
- Player B submits a different amount: UI must source the exact stake from the contract.
- Secret missing or malformed after reload: reveal must be disabled with a clear recovery warning, never submit a guessed secret.
- Expired commit/reveal window: show the correct claim action and never claim before the on-chain deadline.

---

### Task 1: Commitment and secret persistence helpers

**Files:**
- Create: `frontend/src/commitment.mjs`
- Create: `frontend/src/commitment.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces `createSecret() -> bytes32`, `createCommitment(move, secret, account) -> bytes32`, `secretStorageKey(contractAddress, account) -> string`, `saveSecret(storage, key, value)`, `loadSecret(storage, key)`, and `clearSecret(storage, key)`.

- [ ] Write tests for Solidity packed encoding, move validation, random 32-byte secrets, account-scoped storage keys and storage round-trip.
- [ ] Run `npm run test:web` and confirm RED because the helper is not implemented.
- [ ] Implement the smallest helper module with ethers v6.
- [ ] Run `npm run test:web` and confirm GREEN.

### Task 2: Sepolia dapp and CI integration

**Files:**
- Create: `frontend/index.html`
- Create: `frontend/src/contract.js`
- Create: `frontend/src/main.js`
- Create: `frontend/src/style.css`
- Modify: `.gitignore`
- Modify: `.github/workflows/solidity-ci.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes Task 1 helper functions.
- Contract interface: `comprometer(bytes32)`, `revelar(uint8,bytes32)`, `reclamarPorTiempo()`, getters `jugadorA`, `jugadorB`, `apuesta`, `fase`, `resultado`, `ganador`, `limiteSegundoJugador`, `limiteRevelacion`.
- Produces a browser interface with wallet connect, Sepolia enforcement, create/join/reveal/claim, state refresh, and Etherscan links.

- [ ] Build the interface and transaction flow without changing contract code.
- [ ] Add frontend tests and production build to GitHub Actions.
- [ ] Run `npm run test:web`, `npm run build:web`, `npm run compile`, and `npm test`.
- [ ] Review the diff and open a DRAFT PR to `main`.

## Completion boundary
The code/build/CI portion can be completed without signing a transaction. A full on-chain match needs two distinct Sepolia-funded MetaMask accounts and explicit approval of each commit/reveal/claim transaction; do not claim the live match was tested until Etherscan confirms it.