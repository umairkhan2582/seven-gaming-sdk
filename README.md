<div align="center">

  <img src="https://theseven.meme/logo.png" width="100" alt="Seven Chain" />

  # 🎮 seven-gaming-sdk

  **On-Chain Gaming SDK for Seven Chain — 1-Second Finality, Session Keys, EVM Contracts, Unreal Engine Plugin**

  [![Chain ID](https://img.shields.io/badge/Chain%20ID-70007-FFD700?style=for-the-badge&logo=ethereum&logoColor=black)](https://theseven.meme/developers)
  [![Mainnet](https://img.shields.io/badge/Status-Mainnet%20Live-brightgreen?style=for-the-badge)](https://theseven.meme)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org)
  [![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
  [![GitHub Topic](https://img.shields.io/badge/Topic-seven--chain-yellow?style=for-the-badge)](https://github.com/topics/seven-chain)

  [**Live Demo**](https://theseven.meme/game) · [**API Reference**](docs/API.md) · [**Integration Guide**](docs/INTEGRATION.md) · [**Block Explorer**](https://theseven.meme/blockchain/explorer) · [**Telegram**](https://t.me/SevenBlockChain)

</div>

---

## What is Seven Gaming SDK?

Seven Gaming SDK lets you build **on-chain games** on [Seven Chain](https://theseven.meme) — an EVM-compatible Layer 1 blockchain (Chain ID **70007**) with 1-second block finality. Every kill, every move, every action your players take is recorded as a real, immutable blockchain transaction.

| Feature | Seven Chain | Traditional Web3 Gaming |
|---|---|---|
| Block time | **1 second** | 12s (ETH) / 3s (BSC) |
| Gas fees for players | **Zero** | Paid by user |
| Wallet required to start | **No — play first** | Yes |
| Leaderboard | **On-chain, tamper-proof** | Off-chain / centralized |
| Integration time | **Under 30 minutes** | Days |
| Contract language | **Solidity (full EVM)** | Varies |

---

## How the Relay Fee Works for Games

Gamers on Seven Chain pay no gas. Here is how the economics work:

- **Session keys** allow players to sign actions without a wallet popup on every move — one approval at session start, then gasless play throughout
- **Validators** (running [seven-chain-node](https://github.com/umairkhan2582/seven-chain-node)) earn **0.0003 SEVEN per block** for processing game transactions
- **Bridge solvers** (running [seven-chain-solver](https://github.com/umairkhan2582/seven-chain-solver)) earn **0.0004 BNB per settled intent** when players bridge assets in for in-game purchases
- The relay fee is micro and automatic — players never see it; validators and solvers capture it

This means game developers attract players with a zero-friction experience while the chain stays economically sustainable.

---

## Quick Start

### 1. Install the SDK

```bash
npm install @seven-gaming/sdk
# or
pnpm add @seven-gaming/sdk
```

### 2. Start a Game Session

```typescript
import { SevenGameClient } from '@seven-gaming/sdk';

const client = new SevenGameClient({
  apiBase: 'https://theseven.meme'
});

// Start a session — no wallet needed by the player
const session = await client.startSession('PlayerOne');
console.log(session.sessionId);     // UUID
console.log(session.demoWallet);    // 0x7...
console.log(session.chainId);       // 70007
console.log(session.rpc);           // https://theseven.meme/api/seven-chain/jsonrpc
```

### 3. Record On-Chain Actions

```typescript
// Every action fires a real blockchain transaction (~1 second confirmation)
const tx = await client.recordAction(session.sessionId, {
  actionType: 'kill',
  points: 10,
  metadata: { weapon: 'plasma', level: 3 }
});

console.log(tx.txHash);           // 0x...
console.log(tx.blockNumber);      // 42137
console.log(tx.confirmationMs);   // ~1000
```

### 4. Submit Final Score

```typescript
const result = await client.submitScore(session.sessionId);
console.log(result.score);  // 340
console.log(result.rank);   // #7 globally (on-chain leaderboard)
```

---

## Network Details

| Parameter | Value |
|---|---|
| **Network Name** | Seven Chain |
| **Chain ID** | 70007 |
| **RPC URL** | `https://theseven.meme/api/seven-chain/jsonrpc` |
| **Currency Symbol** | SEVEN |
| **Block Explorer** | https://theseven.meme/blockchain/explorer |
| **Block Time** | ~1 second |

---

## Templates

### 1-Second Clicker Game

The fastest way to see Seven Chain in action — every click is a real on-chain transaction confirming in about 1 second.

```bash
open templates/1sec-clicker-game/index.html
```

Live demo: [theseven.meme/game](https://theseven.meme/game)

---

## SDK Reference

### `SevenGameClient`

```typescript
new SevenGameClient(config: { apiBase: string })
```

| Method | Returns | Description |
|---|---|---|
| `startSession(playerName)` | `Promise<GameSession>` | Create a new game session with a demo wallet |
| `recordAction(sessionId, opts)` | `Promise<GameTransaction>` | Record an on-chain action (~1s confirmation) |
| `getTransactions(limit?)` | `Promise<GameTransaction[]>` | Live feed of recent on-chain transactions |
| `submitScore(sessionId)` | `Promise<ScoreResult>` | End session and post score to the on-chain leaderboard |
| `getLeaderboard()` | `Promise<LeaderboardEntry[]>` | Top 20 players from the on-chain leaderboard |
| `getStats()` | `Promise<GameStats>` | Global network stats (total games, transactions, players) |

Full type definitions: [`sdk/src/types.ts`](sdk/src/types.ts)

---

## Smart Contracts

Located in [`contracts/`](contracts/). All contracts deploy to Seven Chain (Chain ID 70007) unchanged from Ethereum.

| Contract | Description |
|---|---|
| `GameCurrency.sol` | ERC-20 in-game currency |
| `GameItemNFT.sol` | ERC-721 game items and equipment |
| `EscrowMatch.sol` | Wagered PvP matches with on-chain escrow |
| `SessionKeys.sol` | Gasless session key delegation for players |
| `BatchMintRewards.sol` | Batch reward distribution to players |
| `StateCompression.sol` | On-chain state compression for leaderboards |

### Deploy Contracts

```bash
cd contracts
npm install
npx hardhat run deploy/01_deploy_all.ts --network sevenchain
```

**Hardhat network config:**

```typescript
networks: {
  sevenchain: {
    url: "https://theseven.meme/api/seven-chain/jsonrpc",
    chainId: 70007,
    accounts: [process.env.PRIVATE_KEY!],
  },
}
```

---

## Unreal Engine Plugin

Located in [`game-engine-plugins/unreal-plugin/`](game-engine-plugins/unreal-plugin/).

Drop `Source/SevenChainSDK/` into your Unreal project's `Source/` folder:

```cpp
#include "SevenChainSDK.h"

// Call from Blueprint or C++
USevenChainSDK::StartSession("PlayerOne", OnSuccess, OnError);
USevenChainSDK::RecordAction(SessionId, "kill", 10, OnSuccess, OnError);
```

---

## API Endpoints

Base URL: `https://theseven.meme`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/gaming/session` | Start a new game session |
| `POST` | `/api/gaming/action` | Record an on-chain action |
| `GET` | `/api/gaming/transactions` | Recent on-chain transaction feed |
| `POST` | `/api/gaming/score` | Submit score to the on-chain leaderboard |
| `GET` | `/api/gaming/leaderboard` | Top 20 players |
| `GET` | `/api/gaming/stats` | Global network stats |

Full reference: [docs/API.md](docs/API.md)

---

## Project Structure

```
seven-gaming-sdk/
├── sdk/                          # TypeScript SDK
│   └── src/
│       ├── game-client.ts        # Main client class
│       ├── session-keys.ts       # Session key helpers
│       ├── types.ts              # All TypeScript types
│       └── index.ts              # Barrel export
├── contracts/                    # Solidity smart contracts
│   ├── contracts/                # Contract source files
│   └── deploy/                   # Hardhat deploy scripts
├── game-engine-plugins/          # Game engine integrations
│   └── unreal-plugin/            # Unreal Engine 5 plugin
├── templates/                    # Ready-to-run game templates
│   └── 1sec-clicker-game/        # Minimal on-chain clicker
└── docs/                         # Extended documentation
    ├── API.md                    # Full API reference
    └── INTEGRATION.md            # Step-by-step integration guide
```

---

## Seven Chain Ecosystem

| Repo | Description |
|---|---|
| [**sevenchain**](https://github.com/umairkhan2582/sevenchain) | Developer hub — network config, Hardhat/Foundry quickstart, API docs |
| [**seven-chain-node**](https://github.com/umairkhan2582/seven-chain-node) | Validator node client — seal blocks, earn SEVEN block rewards |
| [**seven-chain-solver**](https://github.com/umairkhan2582/seven-chain-solver) | Bridge solver — fill cross-chain intents, earn 0.0004 BNB per relay |
| [**seven-creator-kit**](https://github.com/umairkhan2582/seven-creator-kit) | Token launch toolkit — deploy meme tokens, migrate from pump.fun/four.meme |
| [**seven-gaming-sdk**](https://github.com/umairkhan2582/seven-gaming-sdk) | Gaming SDK — 1s finality on-chain games, session keys, Unreal plugin |

All repositories: [`github.com/topics/seven-chain`](https://github.com/topics/seven-chain)

---

## Contributing

Pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — fork it, build on it, ship it.
