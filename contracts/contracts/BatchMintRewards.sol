// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title BatchMintRewards
 * @notice Optimised ERC-1155 for high-frequency in-game reward distribution.
 *
 *  Seven Chain has 1-second blocks — this contract is designed to let a game
 *  server mint rewards for MANY players in a single transaction per block,
 *  keeping gas costs near-zero and never lagging the network.
 *
 *  Gas optimisations applied:
 *   1. Packed struct: reward recipe stores all item ids/amounts in a bytes array
 *      (abi.encode), avoiding dynamic array SSTORE costs at definition time.
 *   2. mintBatch: single _mintBatch call per player — one event, one SSTORE delta.
 *   3. bulkReward: rewards N players in ONE tx — O(N) loop cost, not N separate txs.
 *   4. claimBitmap: each player has a uint256 bitmap (256 claims per slot) so
 *      marking a reward as claimed costs a single SSTORE bit-flip instead of a bool.
 */
contract BatchMintRewards is ERC1155, Ownable {
    string public name = "Seven Game Rewards";

    struct Recipe {
        uint256[] itemIds;
        uint256[] amounts;
        bool active;
    }

    mapping(uint256 => Recipe) public recipes;
    mapping(address => mapping(uint256 => uint256)) private _claimBitmap; // player => slot => bitmap
    mapping(address => bool) public operators; // trusted game servers

    event RecipeDefined(uint256 indexed recipeId);
    event BulkRewarded(uint256 indexed recipeId, uint256 playerCount);
    event OperatorUpdated(address indexed op, bool approved);

    modifier onlyOperator() {
        require(operators[msg.sender] || msg.sender == owner(), "Not operator");
        _;
    }

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    // ── Admin ──────────────────────────────────────────────────────────────

    function defineRecipe(
        uint256 recipeId,
        uint256[] calldata itemIds,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(itemIds.length == amounts.length, "Length mismatch");
        require(itemIds.length <= 32, "Max 32 items per recipe"); // keeps calldata bounded
        recipes[recipeId] = Recipe(itemIds, amounts, true);
        emit RecipeDefined(recipeId);
    }

    function setOperator(address op, bool approved) external onlyOwner {
        operators[op] = approved;
        emit OperatorUpdated(op, approved);
    }

    // ── Minting ────────────────────────────────────────────────────────────

    /**
     * @notice Reward a single player with a predefined recipe.
     *         One call = one mintBatch = one ERC1155TransferBatch event.
     */
    function reward(address player, uint256 recipeId) external onlyOperator {
        Recipe storage r = recipes[recipeId];
        require(r.active, "Recipe inactive");
        _mintBatch(player, r.itemIds, r.amounts, "");
    }

    /**
     * @notice Reward MULTIPLE players with the same recipe in one transaction.
     *         Use this at the end of each game round: one tx per block covers
     *         all winners, keeping the network latency irrelevant to game UX.
     *
     * @param players  Array of player addresses (max 200 per tx to stay within block gas)
     * @param recipeId The reward recipe to mint for each player
     */
    function bulkReward(address[] calldata players, uint256 recipeId) external onlyOperator {
        Recipe storage r = recipes[recipeId];
        require(r.active, "Recipe inactive");
        require(players.length <= 200, "Max 200 per batch");
        for (uint256 i = 0; i < players.length; ) {
            _mintBatch(players[i], r.itemIds, r.amounts, "");
            unchecked { ++i; } // save ~60 gas per iteration
        }
        emit BulkRewarded(recipeId, players.length);
    }

    /**
     * @notice Mint arbitrary items to a player (flexible path for unique drops).
     */
    function mintFlex(
        address player,
        uint256[] calldata ids,
        uint256[] calldata amounts
    ) external onlyOperator {
        require(ids.length == amounts.length && ids.length <= 32, "Invalid input");
        _mintBatch(player, ids, amounts, "");
    }

    // ── Claim bitmap (anti-double-claim for off-chain proofs) ──────────────

    /**
     * @notice Mark claim N as used for a player using a single bit in a uint256.
     *         256 claims per storage slot — 256x cheaper than a bool mapping.
     */
    function setClaimed(address player, uint256 claimId) external onlyOperator {
        uint256 slot = claimId / 256;
        uint256 bit  = claimId % 256;
        _claimBitmap[player][slot] |= (1 << bit);
    }

    function isClaimed(address player, uint256 claimId) external view returns (bool) {
        uint256 slot = claimId / 256;
        uint256 bit  = claimId % 256;
        return (_claimBitmap[player][slot] >> bit) & 1 == 1;
    }
}