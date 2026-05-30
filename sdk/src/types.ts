/** Configuration for SevenGameClient */
export interface SevenGameClientConfig {
  /** Base URL of the Seven platform. Default: https://theseven.meme */
  apiBase?: string;
}

/** A game session returned by startSession() */
export interface GameSession {
  /** UUID — pass to all subsequent calls */
  sessionId: string;
  /** Sanitised player name */
  playerName: string;
  /**
   * The wallet address used for this session.
   * If the player connected a real wallet this is their address;
   * otherwise a demo wallet (0x7…) is generated automatically.
   */
  demoWallet: string;
  /** Same as demoWallet — explicit alias for clarity */
  walletAddress: string;
  /** True when the player connected a real MetaMask / EIP-1193 wallet */
  isRealWallet: boolean;
  /** Seven Chain ID: 70007 */
  chainId: number;
  /** Seven Chain JSON-RPC endpoint (EVM-compatible) */
  rpc: string;
}

/** Options for recordAction() */
export interface RecordActionOptions {
  /** Action label — e.g. "kill", "collect", "levelup", "boss_kill" */
  actionType: string;
  /** Points to award (default: 10) */
  points?: number;
  /** Any extra JSON metadata to store on-chain */
  metadata?: Record<string, unknown>;
}

/** On-chain transaction receipt returned by recordAction() */
export interface GameTransaction {
  /** Full transaction hash (0x…) */
  txHash: string;
  /** Block number the action was included in */
  blockNumber: number;
  /** Whether the block is finalised (always true on Seven Chain) */
  confirmed: boolean;
  /** Milliseconds from request to confirmation */
  confirmationMs: number;
  /** Seven Chain ID: 70007 */
  chainId: number;
  /** Points actually awarded */
  points: number;
}

/** A row from the recent transaction feed */
export interface TransactionFeedEntry {
  tx_hash: string;
  action_type: string;
  block_number: number;
  points: number;
  player_name: string;
  confirmed: boolean;
  created_at: string;
  confirmed_at: string | null;
}

/** Result of submitScore() */
export interface ScoreResult {
  /** Final session score */
  score: number;
  /** Total kill actions */
  kills: number;
  /** Total on-chain transactions fired */
  txCount: number;
  /** Global leaderboard rank */
  rank: number;
}

/** A leaderboard entry */
export interface LeaderboardEntry {
  player_name: string;
  /** Wallet address (real or demo) */
  wallet_address: string;
  score: number;
  kills: number;
  level_reached: number;
  tx_count: number;
  played_at: string;
}

/** Global gaming network stats */
export interface GameStats {
  totalGames: number;
  totalOnChainActions: number;
  topScore: number;
  chainId: number;
  blockTime: string;
  rpc: string;
}

