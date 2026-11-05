# Cripto Cachipún Sepolia Browser Frontend

## Intent
Provide a browser interface for the already deployed CriptoCachipun instance so two distinct MetaMask accounts can play one complete Piedra, Papel o Tijera match on Ethereum Sepolia.

## Goals
- Connect MetaMask and enforce chain ID 11155111 before any write, rechecking the provider and wallet chain immediately before each transaction.
- Read the deployed contract state and show players, stake, phase, deadlines, winner and result.
- Support the existing Commit-Reveal lifecycle: create, join with the exact stake, reveal, and claim after timeout.
- Generate each player's 32-byte secret locally and persist it in that browser profile so a reload does not lose the reveal material.
- Keep the existing Solidity contract and its deployed address unchanged.

## Non-goals
- No mainnet support, real ETH, new contract deployment, custody, backend, account recovery, matchmaking or multi-game factory.
- No change to the nine existing Solidity tests.

## Constraints
- Contract: 0xfb96470312fAA99Cf63186328a5a7e796458c04A.
- Network: Ethereum Sepolia, chain ID 11155111 only.
- Solidity contract creates one match per deployed instance; a new match requires a separately deployed instance.
- Player B must use a different address and send exactly Player A's stake.
- Both players must reveal within five minutes after Player B joins; Player B has five minutes to join after Player A commits.
- Never request or store private keys or seed phrases. Transactions are signed only in MetaMask after explicit user action.
- The secret is kept in browser localStorage, not sent to a server; the UI must warn users not to clear browser data before revealing.

## Architecture
Use a small Vite-served vanilla JavaScript application with ethers v6 and the injected MetaMask provider. Avoid introducing React or a backend because the repository currently contains only a Hardhat Solidity project and the dapp has a single contract instance. Keep the ABI and deployed address in a dedicated config module, commitment and local secret-storage helpers in a testable module, and the UI/transaction orchestration in the application entry point.

## Approaches
1. **Vite + vanilla JS + ethers v6 (selected):** smallest dependency and build surface; fits the existing Hardhat JavaScript repository.
2. React + Vite: useful for a larger multi-screen app, but adds framework and state-management overhead for this one-contract interface.
3. Backend-mediated transactions: rejected because it would add custody/secrets and is unnecessary; MetaMask should sign directly.

## Acceptance
- Frontend helper tests cover Solidity-compatible commitment encoding, invalid moves, random secret shape and secret persistence, Sepolia-only chain gating, player-role isolation, exact on-chain join stake and strict timeout boundaries.
- CI runs the existing Hardhat compile/tests plus frontend tests and a production frontend build.
- UI is read-only until MetaMask is connected; every write is Sepolia-only and initiated by a visible user action.
- Full on-chain match remains pending until two distinct funded Sepolia accounts approve their MetaMask transactions.