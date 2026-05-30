import { ethers } from "ethers";

/**
 * SessionKeyManager — implements the "Holy Grail" session key pattern.
 *
 * THE HANDSHAKE (once per game session):
 *   1. Client calls new SessionKeyManager() — generates random burner keypair in memory
 *   2. Call grantSessionCalldata() to get the tx data
 *   3. Player signs ONE tx via their main wallet (MetaMask / WalletConnect)
 *   4. Done — the game now has a temporary key with zero popups for 2 hours
 *
 * THE 1-SECOND LOOP (every in-game action):
 *   1. Call signAction(actionType, points) — signs with burner key in <1ms
 *   2. Submit to game server or directly to Seven Chain RPC
 *   3. Confirmed on-chain in ~1 second (Chain 70007 block time)
 *   4. Player experiences: zero popups, instant feedback
 *
 * SECURITY:
 *   - Key lives only in memory — wiped when tab closes
 *   - Scoped to specific contracts via the SessionKeys contract
 *   - Auto-expires (default 2 hours)
 *   - Player can call revokeSession() on-chain to kill it instantly
 */
export class SessionKeyManager {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;
  private sessionKeysContract: string | null = null;
  private ownerAddress: string | null = null;

  private static SESSION_KEYS_ABI = [
    "function grantSession(address sessionKey, uint256 expiresAt, uint256 maxGasPerTx) external",
    "function grantSessionWithSig(address owner, address sessionKey, uint256 expiresAt, uint256 maxGasPerTx, uint8 v, bytes32 r, bytes32 s) external",
    "function revokeSession(address sessionKey) external",
    "function revokeAllSessions() external",
    "function isValidSession(address sessionKey) external view returns (bool)",
    "function consumeSession(address sessionKey) external returns (address owner)"
  ];

  constructor(
    rpcUrl = "https://theseven.meme:8545",
    sessionKeysContractAddress?: string
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = ethers.Wallet.createRandom().connect(this.provider);
    this.sessionKeysContract = sessionKeysContractAddress ?? null;
  }

  /** The temporary burner address — pass this to grantSession() on-chain. */
  get address(): string { return this.wallet.address; }

  /** Whether a session contract has been set. */
  get hasContract(): boolean { return !!this.sessionKeysContract; }

  /**
   * Step 1 of the handshake: returns the calldata for the player to sign.
   * Pass this to ethers/viem/wagmi to send from the player's main wallet.
   *
   * @param durationSeconds  How long the session lasts (default 2 hours)
   * @param maxGasPerTx      Max gas per session action (default 500k)
   */
  grantSessionCalldata(
    durationSeconds = 7200,
    maxGasPerTx = 500_000n
  ): { to: string; data: string; expiresAt: number } {
    if (!this.sessionKeysContract) throw new Error("No SessionKeys contract address set");
    const iface = new ethers.Interface(SessionKeyManager.SESSION_KEYS_ABI);
    const expiresAt = Math.floor(Date.now() / 1000) + durationSeconds;
    const data = iface.encodeFunctionData("grantSession", [
      this.wallet.address,
      expiresAt,
      maxGasPerTx
    ]);
    return { to: this.sessionKeysContract, data, expiresAt };
  }

  /**
   * Sign an in-game action with the session key (no popup, <1ms).
   * Returns the signature — attach this to your game server request.
   */
  async signAction(
    actionType: string,
    points: number,
    nonce: number
  ): Promise<string> {
    const payload = ethers.solidityPackedKeccak256(
      ["string", "uint256", "uint256", "uint256"],
      [actionType, points, nonce, (await this.provider.getNetwork()).chainId]
    );
    return this.wallet.signMessage(ethers.getBytes(payload));
  }

  /**
   * Send a transaction using the session key (e.g., call a game contract directly).
   * For server-mediated games, use signAction() instead and let the server submit.
   */
  async sendTransaction(
    to: string,
    data: string,
    value = 0n
  ): Promise<ethers.TransactionReceipt | null> {
    const tx = await this.wallet.sendTransaction({ to, data, value });
    return tx.wait(1);
  }

  /** Check if our session key is still valid on-chain. */
  async isValid(): Promise<boolean> {
    if (!this.sessionKeysContract) return false;
    const contract = new ethers.Contract(
      this.sessionKeysContract,
      SessionKeyManager.SESSION_KEYS_ABI,
      this.provider
    );
    return contract.isValidSession(this.wallet.address) as Promise<boolean>;
  }
}