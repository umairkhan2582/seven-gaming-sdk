// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameCurrency
 * @notice In-game ERC-20 token earned through gameplay on Seven Chain.
 *         Minters are approved game contracts (battle rewards, quest completions).
 */
contract GameCurrency is ERC20, ERC20Burnable, Ownable {
    mapping(address => bool) public minters;
    event MinterUpdated(address indexed m, bool approved);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) Ownable(msg.sender) {}

    function setMinter(address m, bool approved) external onlyOwner { minters[m] = approved; emit MinterUpdated(m, approved); }

    function mint(address to, uint256 amount) external {
        require(minters[msg.sender] || msg.sender == owner(), "Not a minter");
        _mint(to, amount);
    }
}