// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title StateCompression
 * @notice Templates for near-zero gas cost in games where players make many moves per minute.
 *
 *  Problem: naively writing every game-state change to chain costs ~20,000 gas per SSTORE.
 *  On a game where a player makes 60 moves/min, that is 1.2M gas/min = not viable.
 *
 *  This contract shows THREE gas-reduction patterns:
 *
 *  Pattern A — Bitmap Inventory
 *    Pack up to 256 boolean item-ownership flags into a single uint256.
 *    Gas: 1 SSTORE for 256 items vs 256 SSTOREs for individual bools.
 *
 *  Pattern B — Packed Player State
 *    Encode score (uint32), level (uint16), xp (uint32), lastSeen (uint40) into
 *    a single uint256 slot. Only ONE SSTORE for a full state update.
 *
 *  Pattern C — Merkle Checkpoint (off-chain compression)
 *    Instead of writing every move, the game server batches moves off-chain and
 *    commits only a Merkle root per round. Players submit proofs for disputes.
 *    Gas cost: O(1) per round regardless of move count.
 *
 *  Seven Chain has 1-second blocks, so Pattern C checkpoints can flush every block
 *  (each flush = 1 cheap SSTORE). Players can make thousands of moves per minute
 *  with only one on-chain write per second.
 */
contract StateCompression {

    // ────────────────────────────────────────────────────────────────────────
    // Pattern A: Bitmap Inventory — 256 boolean items in one uint256
    // ────────────────────────────────────────────────────────────────────────

    /// @dev player => uint256 where bit N == 1 means player owns item N (ids 0–255)
    mapping(address => uint256) private _inventory;

    function grantItem(address player, uint8 itemId) external {
        _inventory[player] |= (1 << itemId);
    }

    function revokeItem(address player, uint8 itemId) external {
        _inventory[player] &= ~(1 << itemId);
    }

    function hasItem(address player, uint8 itemId) external view returns (bool) {
        return (_inventory[player] >> itemId) & 1 == 1;
    }

    /// @notice Grant multiple items in ONE SSTORE by building the bitmask off-chain.
    function grantItems(address player, uint256 itemBitmask) external {
        _inventory[player] |= itemBitmask;
    }

    // ────────────────────────────────────────────────────────────────────────
    // Pattern B: Packed Player State — full profile in one 256-bit slot
    // ────────────────────────────────────────────────────────────────────────

    /// Bit layout (low → high):
    ///   [0:31]   score   (uint32 — up to 4 billion points)
    ///   [32:47]  level   (uint16 — up to 65535)
    ///   [48:79]  xp      (uint32)
    ///   [80:119] lastSeen (uint40 — unix timestamp, good until year 36812)
    ///   [120:127] flags  (uint8  — 8 boolean flags: hasPet, isVIP, etc.)
    ///   [128:255] reserved

    mapping(address => uint256) private _playerState;

    struct DecodedState {
        uint32 score;
        uint16 level;
        uint32 xp;
        uint40 lastSeen;
        uint8  flags;
    }

    function encodeState(DecodedState memory s) public pure returns (uint256 packed) {
        packed  = uint256(s.score);
        packed |= uint256(s.level)    << 32;
        packed |= uint256(s.xp)       << 48;
        packed |= uint256(s.lastSeen) << 80;
        packed |= uint256(s.flags)    << 120;
    }

    function decodeState(uint256 packed) public pure returns (DecodedState memory s) {
        s.score    = uint32(packed);
        s.level    = uint16(packed >> 32);
        s.xp       = uint32(packed >> 48);
        s.lastSeen = uint40(packed >> 80);
        s.flags    = uint8(packed  >> 120);
    }

    /// @notice Update the full player state in ONE SSTORE.
    function updateState(address player, DecodedState calldata s) external {
        _playerState[player] = encodeState(s);
    }

    function getState(address player) external view returns (DecodedState memory) {
        return decodeState(_playerState[player]);
    }

    // ────────────────────────────────────────────────────────────────────────
    // Pattern C: Merkle Checkpoint — O(1) on-chain cost per round
    // ────────────────────────────────────────────────────────────────────────

    /// @dev round => merkle root of all moves in that round
    mapping(uint256 => bytes32) public roundRoots;
    /// @dev round => block timestamp when committed
    mapping(uint256 => uint256) public roundTimestamp;
    uint256 public latestRound;

    address public gameServer; // trusted off-chain server

    event RoundCheckpointed(uint256 indexed round, bytes32 root);
    event MoveDisputed(uint256 indexed round, address player, bytes32 leaf);

    modifier onlyServer() {
        require(msg.sender == gameServer, "Not game server");
        _;
    }

    constructor(address _gameServer) {
        gameServer = _gameServer;
    }

    /**
     * @notice Game server commits a Merkle root at the end of each round (every block).
     *         All player moves during that second are packed into leaves off-chain.
     *         This single SSTORE covers arbitrarily many moves.
     */
    function checkpoint(uint256 round, bytes32 root) external onlyServer {
        require(round == latestRound + 1, "Round out of order");
        roundRoots[round] = root;
        roundTimestamp[round] = block.timestamp;
        latestRound = round;
        emit RoundCheckpointed(round, root);
    }

    /**
     * @notice Any player can prove their move was included in a round using a Merkle proof.
     *         Use this for dispute resolution — the contract verifies without needing full data.
     *
     * @param round  The round this move belongs to
     * @param leaf   keccak256(abi.encode(player, moveType, value, nonce))
     * @param proof  Sibling hashes from leaf to root
     */
    function verifyMove(
        uint256 round,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool) {
        bytes32 root = roundRoots[round];
        require(root != bytes32(0), "Round not checkpointed");
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; ) {
            bytes32 sibling = proof[i];
            computed = computed < sibling
                ? keccak256(abi.encodePacked(computed, sibling))
                : keccak256(abi.encodePacked(sibling, computed));
            unchecked { ++i; }
        }
        return computed == root;
    }
}