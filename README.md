# Seven Gaming SDK

<div align="center">

![Seven Gaming SDK](https://img.shields.io/badge/Seven%20Chain-70007-FFD700?style=for-the-badge&logo=ethereum&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript)
![EVM Compatible](https://img.shields.io/badge/EVM-Compatible-627EEA?style=for-the-badge&logo=ethereum)

**The first on-chain gaming SDK built on Seven Chain — where every in-game action is a real, immutable blockchain transaction.**

[Live Demo](https://theseven.meme/game) · [API Reference](docs/API.md) · [Integration Guide](docs/INTEGRATION.md) · [Report Bug](https://github.com/umairkhan2582/seven-gaming-sdk/issues)

</div>

---

## What is Seven Gaming SDK?

Seven Gaming SDK lets you build **on-chain games** on [Seven Chain](https://theseven.meme) — a 1-second finality EVM-compatible blockchain. Every kill, every move, every action your players take is recorded as a real transaction on-chain. No gas fees for players, no wallet required to start.

### Why build on Seven Chain?

| Feature | Seven Chain | Traditional Web3 |
|---|---|---|
| Block time | **1 second** | 12s (ETH) / 3s (BSC) |
| Gas fees | **Free for gamers** | Paid by user |
| Wallet required | **No — play first** | Yes |
| Leaderboard | **On-chain, tamper-proof** | Off-chain / centralized |
| Integration time | **< 30 minutes** | Days |

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

// Start a session — no wallet needed
const session = await client.startSession('PlayerOne');
console.log(session.sessionId);    // UUID
console.log(session.demoWallet);   // 0x7...
console.log(session.chainId);      // 70007
console.log(session.rpc);          // https://theseven.meme/api/seven-chain/jsonrpc
```

### 3. Record On-Chain Actions

```typescript
// Every action fires a real blockchain transaction
const tx = await client.recordAction(session.sessionId, {
  actionType: 'kill',
  points: 10,
  metadata: { weapon: 'plasma', level: 3 }
});

console.log(tx.txHash);        // 0x...
console.log(tx.blockNumber);   // 42137
console.log(tx.confirmationMs); // ~1000ms
```

### 4. Submit Final Score

```typescript
const result = await client.submitScore(session.sessionId);
console.log(result.score);  // 340
console.log(result.rank);   // #7 globally
```

---

## Templates

### 1-Second Clicker Game

The fastest way to see Seven Chain in action — a simple clicker game where every click is an on-chain transaction.

```bash
# Just open in browser — no build step
open templates/1sec-clicker-game/index.html
```

Or try it live: **[theseven.meme/game](https://theseven.meme/game)**

---

## SDK Reference

### `SevenGameClient`

```typescript
new SevenGameClient(config: { apiBase: string })
```

| Method | Returns | Description |
|---|---|---|
| `startSession(playerName)` | `Promise<GameSession>` | Create a new game session |
| `recordAction(sessionId, opts)` | `Promise<GameTransaction>` | Record an on-chain action |
| `getTransactions(limit?)` | `Promise<GameTransaction[]>` | Live feed of recent transactions |
| `submitScore(sessionId)` | `Promise<ScoreResult>` | End session, post to leaderboard |
| `getLeaderboard()` | `Promise<LeaderboardEntry[]>` | Top 20 players globally |
| `getStats()` | `Promise<GameStats>` | Global network stats |

Full type definitions: [`sdk/src/types.ts`](sdk/src/types.ts)

---

## Smart Contracts

Located in [`contracts/`](contracts/).

| Contract | Description |
|---|---|
| `GameCurrency.sol` | ERC-20 in-game currency |
| `GameItemNFT.sol` | ERC-721 game items / equipment |
| `EscrowMatch.sol` | Wagered PvP matches with escrow |
| `SessionKeys.sol` | Gasless session key delegation |
| `BatchMintRewards.sol` | Batch reward distribution |
| `StateCompression.sol` | On-chain state compression for leaderboards |

### Deploy Contracts

```bash
cd contracts
npm install
npx hardhat run deploy/01_deploy_all.ts --network sevenchain
```

**Network config** (`hardhat.config.ts`):
```
Chain ID: 70007
RPC:      https://theseven.meme/api/seven-chain/jsonrpc
```

---

## Unreal Engine Plugin

Located in [`game-engine-plugins/unreal-plugin/`](game-engine-plugins/unreal-plugin/).

Drop `Source/SevenChainSDK/` into your Unreal project's `Source/` folder and call from Blueprints or C++:

```cpp
#include "SevenChainSDK.h"

USevenChainSDK::StartSession("PlayerOne", OnSuccess, OnError);
USevenChainSDK::RecordAction(SessionId, "kill", 10, OnSuccess, OnError);
```

---

## API Endpoints

Base URL: `https://theseven.meme`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/gaming/session` | Start a game session |
| `POST` | `/api/gaming/action` | Record an on-chain action |
| `GET` | `/api/gaming/transactions` | Recent transaction feed |
| `POST` | `/api/gaming/score` | Submit score to leaderboard |
| `GET` | `/api/gaming/leaderboard` | Top 20 players |
| `GET` | `/api/gaming/stats` | Global stats |

Full docs: [docs/API.md](docs/API.md)

---

## Project Structure

```
seven-gaming-sdk/
├── sdk/                        # TypeScript SDK
│   └── src/
│       ├── game-client.ts      # Main client class
│       ├── session-keys.ts     # Session key helpers
│       ├── types.ts            # All TypeScript types
│       └── index.ts            # Barrel export
├── contracts/                  # Solidity smart contracts
│   ├── contracts/              # Contract source files
│   └── deploy/                 # Hardhat deploy scripts
├── game-engine-plugins/        # Game engine integrations
│   └── unreal-plugin/          # Unreal Engine 5 plugin
├── templates/                  # Ready-to-run game templates
│   └── 1sec-clicker-game/      # Minimal on-chain clicker
└── docs/                       # Extended documentation
    ├── API.md                  # Full API reference
    └── INTEGRATION.md          # Step-by-step integration guide
```

---

## Contributing

Pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

Built with ⚡ on [Seven Chain](https://theseven.meme) — 1-second finality, EVM compatible

</div>
