/**
 * Session Key Utilities
 *
 * Session keys let players authorise in-game actions without signing every
 * transaction individually. The player signs once to approve a session key,
 * and the game engine uses that key automatically for the duration of the
 * game session.
 *
 * This module provides helpers for generating and managing session keys.
 * For on-chain enforcement, deploy the `SessionKeys.sol` contract.
 */

/** A session key pair */
export interface SessionKeyPair {
  /** Public address of the session key */
  address: string;
  /** Private key — keep in memory only, never persist */
  privateKey: string;
  /** When this key expires (Unix timestamp in seconds) */
  expiresAt: number;
  /** The player's wallet that authorised this key */
  authorisedBy: string;
}

/** Options for generating a session key */
export interface GenerateSessionKeyOptions {
  /** Duration in seconds (default: 3600 = 1 hour) */
  duration?: number;
  /** Player wallet address authorising the key */
  authorisedBy: string;
}

/**
 * Generate a new ephemeral session key pair.
 *
 * Works in browsers (Web Crypto API) and Node.js >= 18 (globalThis.crypto).
 * The returned private key should be kept in memory only and never written to
 * disk or localStorage. It expires automatically after `duration` seconds.
 *
 * @example
 * ```ts
 * import { generateSessionKey } from '@seven-gaming/sdk';
 *
 * const key = generateSessionKey({ authorisedBy: playerAddress, duration: 3600 });
 * // Present key.address to the player for approval via SessionKeys.sol
 * ```
 */
export function generateSessionKey(
  options: GenerateSessionKeyOptions
): SessionKeyPair {
  const duration  = options.duration ?? 3600;
  const expiresAt = Math.floor(Date.now() / 1000) + duration;

  // Use Web Crypto API — available in browsers and Node.js >= 18
  const privateKeyBytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(privateKeyBytes);

  const privateKey =
    "0x" +
    Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  // Derive a placeholder address from the first 20 bytes of the private key.
  // In production, use ethers.js or viem to derive the real public address.
  const address = "0x" + privateKey.slice(2, 42);

  return {
    address,
    privateKey,
    expiresAt,
    authorisedBy: options.authorisedBy,
  };
}

/**
 * Check whether a session key is still valid.
 */
export function isSessionKeyValid(key: SessionKeyPair): boolean {
  return Math.floor(Date.now() / 1000) < key.expiresAt;
}

/**
 * Format the remaining time on a session key as a human-readable string.
 */
export function sessionKeyTimeRemaining(key: SessionKeyPair): string {
  const remaining = key.expiresAt - Math.floor(Date.now() / 1000);
  if (remaining <= 0) return "expired";
  if (remaining < 60) return `${remaining}s`;
  if (remaining < 3600) return `${Math.floor(remaining / 60)}m`;
  return `${Math.floor(remaining / 3600)}h`;
}

