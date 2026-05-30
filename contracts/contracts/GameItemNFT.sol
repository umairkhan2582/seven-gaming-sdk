// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GameItemNFT
 * @notice ERC-1155 batch-mintable item NFT for Seven Chain games.
 *         Authorised game contracts can mint without owner approval.
 */
contract GameItemNFT is ERC1155, Ownable {
    string public name = "Seven Game Items";
    mapping(uint256 => string)  public itemName;
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalSupply;
    mapping(address => bool)    public gameContracts;

    event ItemDefined(uint256 indexed id, string name_, uint256 max);
    event GameContractUpdated(address indexed addr, bool approved);

    modifier onlyGame() { require(gameContracts[msg.sender] || msg.sender == owner(), "Not authorised"); _; }

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    function defineItem(uint256 id, string calldata name_, uint256 max_) external onlyOwner {
        itemName[id] = name_; maxSupply[id] = max_;
        emit ItemDefined(id, name_, max_);
    }

    function mint(address to, uint256 id, uint256 amount, bytes calldata data) external onlyGame {
        if (maxSupply[id] > 0) require(totalSupply[id] + amount <= maxSupply[id], "Exceeds max");
        totalSupply[id] += amount;
        _mint(to, id, amount, data);
    }

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external onlyGame {
        for (uint256 i; i < ids.length;) {
            if (maxSupply[ids[i]] > 0) require(totalSupply[ids[i]] + amounts[i] <= maxSupply[ids[i]], "Exceeds max");
            totalSupply[ids[i]] += amounts[i];
            unchecked { ++i; }
        }
        _mintBatch(to, ids, amounts, data);
    }

    function setGameContract(address addr, bool approved) external onlyOwner {
        gameContracts[addr] = approved;
        emit GameContractUpdated(addr, approved);
    }
}