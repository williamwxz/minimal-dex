// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MinimalDex {
    struct LiquidityPool {
        uint256 reserveA;
        uint256 reserveB;
    }

    // Mapping of token pair => reserves
    mapping(address => mapping(address => LiquidityPool)) public liquidityPools;

    // Indexed by tokenA and tokenB
    event LiquidityAdded(address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB);
    event Swapped(address indexed fromToken, address indexed toToken, uint256 amountIn, uint256 amountOut);

    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountA,
        uint256 amountB
    ) external {
        require(tokenA != tokenB, "Tokens must be different");
        require(amountA > 0 && amountB > 0, "Amounts must be greater than zero");

        // Ideally, there should be slippage protection

        // Transfer tokens from user to contract
        require(IERC20(tokenA).transferFrom(msg.sender, address(this), amountA), "Transfer of token A failed");
        require(IERC20(tokenB).transferFrom(msg.sender, address(this), amountB), "Transfer of token B failed");

        // Store reserves
        liquidityPools[tokenA][tokenB].reserveA += amountA;
        liquidityPools[tokenA][tokenB].reserveB += amountB;

        emit LiquidityAdded(tokenA, tokenB, amountA, amountB);
    }

    // Direct token swap, no slippage protection, if no liquidity, revert
    function swap(
        address fromToken,
        address toToken,
        uint256 amountIn
    ) external {
        require(fromToken != toToken, "Tokens must be different");
        require(amountIn > 0, "Swap amount must be greater than zero");

        LiquidityPool storage pool = liquidityPools[fromToken][toToken];

        // Ensure liquidity exists
        require(pool.reserveA > 0 && pool.reserveB > 0, "No liquidity for this pair");

        // (reserveA + amountIn) * (reserveB - amountOut) = reserveA * reserveB
        // reserveA * reserveB - reserveA * amountOut + amountIn * reserveB - amountIn * amountOut = reserveA * reserveB
        // amountIn * reserveB  = reserveA * amountOut + amountIn * amountOut
        // amountIn * reserveB = amountOut * (reserveA + amountIn)
        // amountOut = (amountIn * reserveB) / (reserveA + amountIn)
        uint256 amountOut = (pool.reserveB * amountIn) / (pool.reserveA + amountIn);

        // Update reserves
        pool.reserveA += amountIn;
        pool.reserveB -= amountOut;

        // Transfer tokens
        require(IERC20(fromToken).transferFrom(msg.sender, address(this), amountIn), "Transfer of input token failed");
        require(IERC20(toToken).transfer(msg.sender, amountOut), "Transfer of output token failed");

        emit Swapped(fromToken, toToken, amountIn, amountOut);
    }
}