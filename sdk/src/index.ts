/**
 * @seven-gaming/sdk
 *
 * The official SDK for building on-chain games on Seven Chain.
 * Every in-game action is a real, immutable blockchain transaction.
 *
 * @see https://github.com/umairkhan2582/seven-gaming-sdk
 * @see https://theseven.meme/game
 */

export { SevenGameClient } from './game-client';
export {
  generateSessionKey,
  isSessionKeyValid,
  sessionKeyTimeRemaining,
} from './session-keys';

export type {
  SevenGameClientConfig,
  GameSession,
  RecordActionOptions,
  GameTransaction,
  TransactionFeedEntry,
  ScoreResult,
  LeaderboardEntry,
  GameStats,
  SessionKeyPair,
  GenerateSessionKeyOptions,
} from './types';

/** Seven Chain network constants */
export const SEVEN_CHAIN = {
  CHAIN_ID: 70007,
  RPC_URL: 'https://theseven.meme/api/seven-chain/jsonrpc',
  BLOCK_TIME_MS: 1000,
  CURRENCY_SYMBOL: 'SEVEN',
  EXPLORER: 'https://theseven.meme',
} as const;
