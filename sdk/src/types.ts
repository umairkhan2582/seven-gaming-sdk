export interface GameSession { sessionId: string; playerName: string; demoWallet: string; chainId: number; rpc: string; }
export interface GameAction { sessionId: string; actionType: "kill"|"collect"|"powerup"|"level_up"|"custom"; points?: number; metadata?: Record<string, unknown>; }
export interface GameTx { txHash: string; blockNumber: number; confirmed: boolean; confirmationMs: number; chainId: number; points: number; }
export interface LeaderboardEntry { player_name: string; score: number; kills: number; level_reached: number; tx_count: number; played_at: string; }