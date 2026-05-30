# Seven Gaming SDK — API Reference

Base URL: `https://theseven.meme`

All endpoints return JSON. All `POST` requests require `Content-Type: application/json`.

---

## Authentication

No API key is required for gaming endpoints. Sessions are identified by the `sessionId` UUID returned when you start a session.

---

## Endpoints

### POST `/api/gaming/session`

Create a new game session. Returns a demo wallet and RPC connection details.

**Request Body**

```json
{
  "playerName": "string (optional, max 32 chars, default: 'Player')"
}
```

**Response `200 OK`**

```json
{
  "sessionId":   "8c6b5e75-cced-4431-9f2f-bc8f07c7cffa",
  "playerName":  "PlayerOne",
  "demoWallet":  "0x787cabe7256e01f5bf1acd72dbda4ed6d94fcf5",
  "chainId":     70007,
  "rpc":         "https://theseven.meme/api/seven-chain/jsonrpc"
}
```

| Field | Type | Description |
|---|---|---|
| `sessionId` | `string (UUID)` | Unique session identifier — use in all subsequent calls |
| `playerName` | `string` | Sanitized player name |
| `demoWallet` | `string` | Auto-generated demo wallet address (0x7...) |
| `chainId` | `number` | Seven Chain ID — `70007` |
| `rpc` | `string` | Seven Chain JSON-RPC endpoint (EVM compatible) |

---

### POST `/api/gaming/action`

Record an in-game action as an on-chain transaction. Returns the transaction hash and block number within ~1 second.

**Request Body**

```json
{
  "sessionId":  "8c6b5e75-cced-4431-9f2f-bc8f07c7cffa",
  "actionType": "kill",
  "points":     10,
  "metadata":   { "weapon": "plasma", "level": 3 }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `sessionId` | `string` | ✅ | Session UUID from `/api/gaming/session` |
| `actionType` | `string` | ✅ | Action name (`"kill"`, `"collect"`, `"levelup"`, etc.) |
| `points` | `number` | ❌ | Points to award (default: 10) |
| `metadata` | `object` | ❌ | Any extra data to store on-chain |

**Response `200 OK`**

```json
{
  "txHash":          "0xabc123...",
  "blockNumber":     42137,
  "confirmed":       true,
  "confirmationMs":  1042,
  "chainId":         70007,
  "points":          10
}
```

**Response `400 Bad Request`** — missing `sessionId` or `actionType`

```json
{ "error": "sessionId and actionType required" }
```

---

### GET `/api/gaming/transactions`

Returns a live feed of the most recent on-chain game transactions across all sessions.

**Query Parameters**

| Param | Type | Default | Max | Description |
|---|---|---|---|---|
| `limit` | `number` | `20` | `50` | Number of transactions to return |

**Response `200 OK`**

```json
[
  {
    "tx_hash":      "0xabc123...",
    "action_type":  "kill",
    "block_number": 42137,
    "points":       10,
    "player_name":  "PlayerOne",
    "confirmed":    true,
    "created_at":   "2026-05-30T16:30:00.000Z",
    "confirmed_at": "2026-05-30T16:30:01.042Z"
  }
]
```

---

### POST `/api/gaming/score`

End a game session and submit the final score to the leaderboard.

**Request Body**

```json
{
  "sessionId": "8c6b5e75-cced-4431-9f2f-bc8f07c7cffa"
}
```

**Response `200 OK`**

```json
{
  "score":    340,
  "kills":    34,
  "txCount":  34,
  "rank":     7
}
```

| Field | Type | Description |
|---|---|---|
| `score` | `number` | Final score |
| `kills` | `number` | Total kill actions recorded |
| `txCount` | `number` | Total on-chain transactions fired |
| `rank` | `number` | Global leaderboard rank |

**Response `404 Not Found`** — session not found

```json
{ "error": "Session not found" }
```

---

### GET `/api/gaming/leaderboard`

Returns the top 20 players globally, sorted by score.

**Response `200 OK`**

```json
[
  {
    "player_name":    "PlayerOne",
    "score":          4200,
    "kills":          420,
    "level_reached":  7,
    "tx_count":       420,
    "played_at":      "2026-05-30T16:30:00.000Z"
  }
]
```

---

### GET `/api/gaming/stats`

Returns global network statistics — useful for showcasing Seven Chain's speed on your game's UI.

**Response `200 OK`**

```json
{
  "totalGames":          1337,
  "totalOnChainActions": 84203,
  "topScore":            9001,
  "chainId":             70007,
  "blockTime":           "1 second",
  "rpc":                 "https://theseven.meme/api/seven-chain/jsonrpc"
}
```

---

## Seven Chain JSON-RPC

Seven Chain is EVM compatible. Use the standard Ethereum JSON-RPC API:

```
Endpoint: https://theseven.meme/api/seven-chain/jsonrpc
Chain ID: 70007
Currency: 7 (SEVEN)
Block time: ~1 second
```

**Example — get latest block:**

```bash
curl -X POST https://theseven.meme/api/seven-chain/jsonrpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

**Use with ethers.js:**

```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(
  'https://theseven.meme/api/seven-chain/jsonrpc'
);

const blockNumber = await provider.getBlockNumber();
```

---

## Error Codes

| HTTP Status | Meaning |
|---|---|
| `200` | Success |
| `400` | Bad request — check required fields |
| `404` | Resource not found (e.g. invalid sessionId) |
| `500` | Server error — check error message |

---

## Rate Limits

Currently no rate limits are enforced during the beta period. Please be respectful — don't exceed 100 requests/second per IP.
