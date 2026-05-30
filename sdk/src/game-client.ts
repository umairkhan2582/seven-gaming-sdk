import type { GameSession, GameAction, GameTx, LeaderboardEntry } from "./types";

/**
 * SevenGameClient - JavaScript/TypeScript SDK for Seven Chain gaming.
 * Chain ID 70007, ~1-second block time. Every action is on-chain.
 */
export class SevenGameClient {
  private base: string;
  private _session: GameSession | null = null;

  constructor(base = "https://theseven.meme") { this.base = base.replace(/\/$/, ""); }

  private async req<T>(m: string, p: string, body?: unknown): Promise<T> {
    const r = await fetch(this.base + "/api/gaming" + p, {
      method: m, headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
    return r.json();
  }

  async createSession(playerName: string): Promise<GameSession> {
    const s = await this.req<GameSession>("POST", "/session", { playerName });
    this._session = s; return s;
  }
  async recordAction(a: GameAction): Promise<GameTx> { return this.req("POST", "/action", a); }
  async recordKill(sessionId: string, points = 10): Promise<GameTx> { return this.recordAction({ sessionId, actionType: "kill", points }); }
  async getTransactions(limit = 20): Promise<GameTx[]> { return this.req("GET", `/transactions?limit=${limit}`); }
  async submitScore(sessionId: string) { return this.req<{ score: number; kills: number; txCount: number; rank: number }>("POST", "/score", { sessionId }); }
  async getLeaderboard(): Promise<LeaderboardEntry[]> { return this.req("GET", "/leaderboard"); }
  async getStats() { return this.req<{ totalGames: number; totalOnChainActions: number; topScore: number; chainId: number; blockTime: string }>("GET", "/stats"); }

  get session() { return this._session; }
}