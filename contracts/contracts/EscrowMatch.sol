// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EscrowMatch
 * @notice On-chain wager escrow and match adjudication for Seven Chain PvP games.
 *
 *  FLOW:
 *   1. playerA calls create(matchId, playerB, resolver) with wager ETH
 *   2. playerB calls deposit(matchId) with equal ETH — match goes Active
 *   3. Game server (resolver) calls resolve(matchId, winner) — winner paid in ~1s
 *   4. If playerB never deposits, playerA can cancel after TIMEOUT
 *
 *  Seven Chain 1-second blocks mean step 3 → winner receives funds in ~1 second.
 */
contract EscrowMatch {
    enum State { Pending, Active, Resolved, Cancelled }

    struct Match {
        address playerA;
        address playerB;
        uint256 wager;
        address winner;
        State   state;
        address resolver;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    mapping(bytes32 => Match) public matches;
    address public feeTo;
    uint256 public feePercent = 2; // 2% platform fee
    uint256 public constant TIMEOUT = 10 minutes;

    event MatchCreated(bytes32 indexed id, address a, address b, uint256 wager);
    event MatchActive(bytes32 indexed id);
    event MatchResolved(bytes32 indexed id, address winner, uint256 payout);
    event MatchCancelled(bytes32 indexed id);

    constructor(address _feeTo) { feeTo = _feeTo; }

    function create(bytes32 id, address playerB, address resolver) external payable {
        require(msg.value > 0, "Wager required");
        require(matches[id].playerA == address(0), "ID taken");
        matches[id] = Match(msg.sender, playerB, msg.value, address(0), State.Pending, resolver, block.timestamp, 0);
        emit MatchCreated(id, msg.sender, playerB, msg.value);
    }

    function deposit(bytes32 id) external payable {
        Match storage m = matches[id];
        require(msg.sender == m.playerB, "Not playerB");
        require(msg.value == m.wager, "Wrong wager");
        require(m.state == State.Pending, "Not pending");
        m.state = State.Active;
        emit MatchActive(id);
    }

    function resolve(bytes32 id, address winner) external {
        Match storage m = matches[id];
        require(msg.sender == m.resolver, "Not resolver");
        require(m.state == State.Active, "Not active");
        require(winner == m.playerA || winner == m.playerB, "Invalid winner");
        uint256 pot    = m.wager * 2;
        uint256 fee    = pot * feePercent / 100;
        uint256 payout = pot - fee;
        m.winner = winner; m.state = State.Resolved; m.resolvedAt = block.timestamp;
        if (fee > 0) payable(feeTo).transfer(fee);
        payable(winner).transfer(payout);
        emit MatchResolved(id, winner, payout);
    }

    function cancel(bytes32 id) external {
        Match storage m = matches[id];
        require(m.state == State.Pending, "Not cancellable");
        require(msg.sender == m.playerA || block.timestamp > m.createdAt + TIMEOUT, "Not allowed");
        m.state = State.Cancelled;
        payable(m.playerA).transfer(m.wager);
        emit MatchCancelled(id);
    }
}