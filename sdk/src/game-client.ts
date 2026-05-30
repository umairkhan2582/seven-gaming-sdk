import type {
  SevenGameClientConfig,
  GameSession,
  RecordActionOptions,
  GameTransaction,
  TransactionFeedEntry,
  ScoreResult,
  LeaderboardEntry,
  GameStats,
} from './types';

const DEFAULT_API_BASE = 'https://theseven.meme';

/**
 * SevenGameClient — the main entry point for the Seven Gaming SDK.
 *
 * Every in-game action is recorded as a real, immutable transaction on Seven
 * Chain (Chain ID 70007) with ~1-second finality. No wallet or gas fees are
 * required for players to start.
 *
 * @example
 * ```ts
 * import { SevenGameClient } from '@seven-gaming/sdk';
 *
 * const client = new SevenGameClient();
 *
 * const session = await client.startSession('PlayerOne');
 * const tx      = await client.recordAction(session.sessionId, { actionType: 'kill', points: 10 });
 * const result  = await client.submitScore(session.sessionId);
 * console.log(`Rank #${result.rank}`);
 * ```
 */
export class SevenGameClient {
  private readonly apiBase: string;

  constructor(config: SevenGameClientConfig = {}) {
    this.apiBase = (config.apiBase ?? DEFAULT_API_BASE).replace(/\/$/, '');
  }

  // ─── Internal helpers ────────────────────────────────────────────────────

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(`Seven API error ${res.status}: ${(err as any).error ?? res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`);
    if (!res.ok) {
      throw new Error(`Seven API error ${res.status}: ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Start a new game session.
   *
   * Returns a `sessionId` UUID to pass to all subsequent calls, plus a demo
   * wallet address and Seven Chain connection details.
   *
   * @param playerName - Display name (max 32 chars). Defaults to "Player".
   */
  async startSession(playerName = 'Player'): Promise<GameSession> {
    return this.post<GameSession>('/api/gaming/session', { playerName });
  }

  /**
   * Record an in-game action as an on-chain transaction.
   *
   * Returns the transaction hash and block number within ~1 second.
   *
   * @param sessionId - UUID from `startSession()`
   * @param options   - Action type, points, and optional metadata
   */
  async recordAction(
    sessionId: string,
    options: RecordActionOptions
  ): Promise<GameTransaction> {
    return this.post<GameTransaction>('/api/gaming/action', {
      sessionId,
      actionType: options.actionType,
      points: options.points ?? 10,
      metadata: options.metadata ?? {},
    });
  }

  /**
   * Fetch the live feed of recent on-chain game transactions (all players).
   *
   * @param limit - Number of transactions to return (max 50, default 20)
   */
  async getTransactions(limit = 20): Promise<TransactionFeedEntry[]> {
    const safe = Math.min(limit, 50);
    return this.get<TransactionFeedEntry[]>(`/api/gaming/transactions?limit=${safe}`);
  }

  /**
   * End the session and submit the player's score to the global leaderboard.
   *
   * @param sessionId - UUID from `startSession()`
   */
  async submitScore(sessionId: string): Promise<ScoreResult> {
    return this.post<ScoreResult>('/api/gaming/score', { sessionId });
  }

  /**
   * Fetch the top 20 players on the global leaderboard, sorted by score.
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    return this.get<LeaderboardEntry[]>('/api/gaming/leaderboard');
  }

  /**
   * Fetch global gaming network statistics.
   *
   * Useful for displaying Seven Chain speed metrics in your game UI.
   */
  async getStats(): Promise<GameStats> {
    return this.get<GameStats>('/api/gaming/stats');
  }
}
