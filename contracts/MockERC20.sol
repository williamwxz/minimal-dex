// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    // for testing purposes
    bool public failTransfers;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 10000 * (10 ** decimals()));
    }

    // for testing purposes
    function setFailTransfers(bool _fail) external {
        failTransfers = _fail;
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        // for testing purposes
        if (failTransfers) {
            return false;
        }
        return super.transferFrom(from, to, amount);
    }
}
