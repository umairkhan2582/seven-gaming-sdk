# Integration Guide — Seven Gaming SDK

This guide walks you through integrating Seven Chain into an existing game in under 30 minutes.

---

## Prerequisites

- A web game (JavaScript, TypeScript, React, Vue, Phaser, Unity WebGL, etc.)
- Access to `https://theseven.meme` (no API key needed)

---

## Option A — Vanilla JavaScript (No Install)

The fastest path. Copy-paste into any HTML game.

```html
<script>
const SEVEN_API = "https://theseven.meme";
let gameSession = null;

// Step 1: Start session when player enters their name
async function startGame(playerName) {
  const res = await fetch(SEVEN_API + "/api/gaming/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerName })
  });
  gameSession = await res.json();
  console.log("Session started:", gameSession.sessionId);
}

// Step 2: Call this on game events (kills, power-ups, level ups, etc.)
async function onGameEvent(actionType, points = 10, metadata = {}) {
  if (!gameSession) return;
  const res = await fetch(SEVEN_API + "/api/gaming/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: gameSession.sessionId,
      actionType,
      points,
      metadata
    })
  });
  const tx = await res.json();
  console.log("On-chain tx:", tx.txHash, "Block:", tx.blockNumber);
  return tx;
}

// Step 3: Submit score when game ends
async function endGame() {
  if (!gameSession) return;
  const res = await fetch(SEVEN_API + "/api/gaming/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: gameSession.sessionId })
  });
  const result = await res.json();
  console.log("Final rank:", result.rank, "Score:", result.score);
  return result;
}
</script>
```

---

## Option B — TypeScript SDK

### Install

```bash
npm install @seven-gaming/sdk
```

### Usage

```typescript
import { SevenGameClient } from '@seven-gaming/sdk';

const seven = new SevenGameClient({
  apiBase: 'https://theseven.meme'
});

// On player start
const session = await seven.startSession('PlayerOne');

// On game event
const tx = await seven.recordAction(session.sessionId, {
  actionType: 'kill',
  points: 10,
  metadata: { weapon: 'plasma', level: 3 }
});

// Show confirmation UI
console.log(`Block #${tx.blockNumber} confirmed in ${tx.confirmationMs}ms`);

// On game over
const result = await seven.submitScore(session.sessionId);
console.log(`You ranked #${result.rank} globally!`);
```

---

## Option C — React Hook

```typescript
// hooks/useSevenChain.ts
import { useState, useCallback } from 'react';

const API = 'https://theseven.meme';

export function useSevenChain() {
  const [session, setSession] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [loading, setLoading] = useState(false);

  const startSession = useCallback(async (playerName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/gaming/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      });
      const data = await res.json();
      setSession(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const recordAction = useCallback(async (
    actionType: string,
    points = 10,
    metadata = {}
  ) => {
    if (!session) throw new Error('No active session');
    const res = await fetch(`${API}/api/gaming/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, actionType, points, metadata }),
    });
    const tx = await res.json();
    setLastTx(tx);
    return tx;
  }, [session]);

  const submitScore = useCallback(async () => {
    if (!session) throw new Error('No active session');
    const res = await fetch(`${API}/api/gaming/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId }),
    });
    return res.json();
  }, [session]);

  return { session, lastTx, loading, startSession, recordAction, submitScore };
}
```

```tsx
// In your component
function GameComponent() {
  const { session, lastTx, startSession, recordAction, submitScore } = useSevenChain();

  return (
    <div>
      {!session ? (
        <button onClick={() => startSession('PlayerOne')}>
          Start Game
        </button>
      ) : (
        <>
          <button onClick={() => recordAction('kill', 10)}>
            Fire!
          </button>
          {lastTx && (
            <p>Block #{lastTx.blockNumber} — {lastTx.confirmationMs}ms</p>
          )}
          <button onClick={submitScore}>End Game</button>
        </>
      )}
    </div>
  );
}
```

---

## Option D — Phaser 3

```typescript
// src/scenes/GameScene.ts
import Phaser from 'phaser';

const API = 'https://theseven.meme';

export class GameScene extends Phaser.Scene {
  private sessionId: string | null = null;
  private score = 0;

  async create() {
    // Start session on scene create
    const res = await fetch(`${API}/api/gaming/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName: this.registry.get('playerName') })
    });
    const session = await res.json();
    this.sessionId = session.sessionId;
  }

  // Call this in your game logic (on enemy kill, item collect, etc.)
  async recordKill() {
    if (!this.sessionId) return;
    const res = await fetch(`${API}/api/gaming/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: this.sessionId,
        actionType: 'kill',
        points: 10,
        metadata: { scene: this.scene.key }
      })
    });
    const tx = await res.json();
    this.score += tx.points;
    // Update score display
    this.registry.set('score', this.score);
  }

  async gameOver() {
    if (!this.sessionId) return;
    const res = await fetch(`${API}/api/gaming/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId })
    });
    const result = await res.json();
    this.scene.start('GameOverScene', result);
  }
}
```

---

## Showing the Live Transaction Feed

Add a live feed of on-chain transactions to your game UI for the "wow factor":

```javascript
async function startTransactionFeed(onTx) {
  // Poll every 2 seconds
  setInterval(async () => {
    const res = await fetch('https://theseven.meme/api/gaming/transactions?limit=5');
    const txs = await res.json();
    txs.forEach(onTx);
  }, 2000);
}

// Usage
startTransactionFeed((tx) => {
  console.log(`${tx.player_name} fired ${tx.action_type} → Block #${tx.block_number}`);
});
```

---

## Showing the Leaderboard

```javascript
async function renderLeaderboard(containerId) {
  const res = await fetch('https://theseven.meme/api/gaming/leaderboard');
  const rows = await res.json();

  const html = rows.map((r, i) =>
    `<tr>
      <td>#${i + 1}</td>
      <td>${r.player_name}</td>
      <td>${r.score.toLocaleString()}</td>
      <td>${r.kills}</td>
      <td>${r.tx_count} txs</td>
    </tr>`
  ).join('');

  document.getElementById(containerId).innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Player</th><th>Score</th><th>Kills</th><th>On-Chain</th></tr></thead>
      <tbody>${html}</tbody>
    </table>
  `;
}
```

---

## Connecting a Real Wallet (Optional)

Players can connect MetaMask or any EVM wallet to Seven Chain:

```
Network Name: Seven Chain
RPC URL:      https://theseven.meme/api/seven-chain/jsonrpc
Chain ID:     70007
Currency:     7 (SEVEN)
```

```javascript
// Add Seven Chain to MetaMask
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x1136F',          // 70007 in hex
    chainName: 'Seven Chain',
    rpcUrls: ['https://theseven.meme/api/seven-chain/jsonrpc'],
    nativeCurrency: { name: 'Seven', symbol: 'SEVEN', decimals: 18 },
    blockExplorerUrls: ['https://theseven.meme']
  }]
});
```

---

## Testing Your Integration

```bash
# Create a session
curl -X POST https://theseven.meme/api/gaming/session \
  -H "Content-Type: application/json" \
  -d '{"playerName": "TestPilot"}'

# Record an action (replace SESSION_ID)
curl -X POST https://theseven.meme/api/gaming/action \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","actionType":"kill","points":10}'

# Check leaderboard
curl https://theseven.meme/api/gaming/leaderboard

# Check global stats
curl https://theseven.meme/api/gaming/stats
```

---

## Support

- Open an issue: [github.com/umairkhan2582/seven-gaming-sdk/issues](https://github.com/umairkhan2582/seven-gaming-sdk/issues)
- Live platform: [theseven.meme](https://theseven.meme)
- Game demo: [theseven.meme/game](https://theseven.meme/game)
