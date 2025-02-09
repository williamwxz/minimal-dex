const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MinimalDex", function () {
    let minimalDex;
    let tokenA;
    let tokenB;
    let owner;
    let user1;
    let user2;

    const INITIAL_SUPPLY = ethers.parseEther("10000");
    const INITIAL_LIQUIDITY = ethers.parseEther("1000");

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        tokenA = await MockERC20.deploy("Mock USDC", "USDC");
        await tokenA.waitForDeployment();
        
        tokenB = await MockERC20.deploy("Mock USDT", "USDT");
        await tokenB.waitForDeployment();

        const MinimalDex = await ethers.getContractFactory("MinimalDex");
        minimalDex = await MinimalDex.deploy();
        await minimalDex.waitForDeployment();

        await tokenA.approve(minimalDex.target, INITIAL_SUPPLY);
        await tokenB.approve(minimalDex.target, INITIAL_SUPPLY);

        const quarterSupply = INITIAL_SUPPLY / 4n;

        await tokenA.transfer(user1.address, quarterSupply);
        await tokenB.transfer(user1.address, quarterSupply);
        await tokenA.transfer(user2.address, quarterSupply);
        await tokenB.transfer(user2.address, quarterSupply);

        await tokenA.connect(user1).approve(minimalDex.target, INITIAL_SUPPLY);
        await tokenB.connect(user1).approve(minimalDex.target, INITIAL_SUPPLY);
        await tokenA.connect(user2).approve(minimalDex.target, INITIAL_SUPPLY);
        await tokenB.connect(user2).approve(minimalDex.target, INITIAL_SUPPLY);
    });

    describe("Liquidity Provision", function () {
        it("Should add initial liquidity correctly", async function () {
            await minimalDex.addLiquidity(
                tokenA.target,
                tokenB.target,
                INITIAL_LIQUIDITY,
                INITIAL_LIQUIDITY
            );

            const pool = await minimalDex.liquidityPools(tokenA.target, tokenB.target);
            expect(pool.reserveA).to.equal(INITIAL_LIQUIDITY);
            expect(pool.reserveB).to.equal(INITIAL_LIQUIDITY);
        });

        it("Should emit LiquidityAdded event", async function () {
            await expect(minimalDex.addLiquidity(
                tokenA.target,
                tokenB.target,
                INITIAL_LIQUIDITY,
                INITIAL_LIQUIDITY
            ))
                .to.emit(minimalDex, "LiquidityAdded")
                .withArgs(tokenA.target, tokenB.target, INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);
        });

        it("Should fail when adding liquidity with same token", async function () {
            await expect(
                minimalDex.addLiquidity(
                    tokenA.target,
                    tokenA.target,
                    INITIAL_LIQUIDITY,
                    INITIAL_LIQUIDITY
                )
            ).to.be.revertedWith("Tokens must be different");
        });

        it("Should fail when adding zero liquidity", async function () {
            await expect(
                minimalDex.addLiquidity(
                    tokenA.target,
                    tokenB.target,
                    0,
                    INITIAL_LIQUIDITY
                )
            ).to.be.revertedWith("Amounts must be greater than zero");
        });

        it("Should fail when only amountA is zero", async function () {
            await expect(
                minimalDex.addLiquidity(
                    tokenA.target,
                    tokenB.target,
                    0,
                    INITIAL_LIQUIDITY
                )
            ).to.be.revertedWith("Amounts must be greater than zero");
        });

        it("Should fail when only amountB is zero", async function () {
            await expect(
                minimalDex.addLiquidity(
                    tokenA.target,
                    tokenB.target,
                    INITIAL_LIQUIDITY,
                    0
                )
            ).to.be.revertedWith("Amounts must be greater than zero");
        });

        it("Should fail when token transfer fails", async function () {
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const mockToken = await MockERC20.deploy("Mock USDC 3", "USDC3");
            await mockToken.waitForDeployment();
            await mockToken.setFailTransfers(true);

            await expect(
                minimalDex.addLiquidity(
                    mockToken.target,
                    tokenB.target,
                    INITIAL_LIQUIDITY,
                    INITIAL_LIQUIDITY
                )
            ).to.be.revertedWith("Transfer of token A failed");
        });
    });

    describe("Swapping", function () {
        beforeEach(async function () {
            await minimalDex.addLiquidity(
                tokenA.target,
                tokenB.target,
                INITIAL_LIQUIDITY,
                INITIAL_LIQUIDITY
            );
        });

        it("Should execute swap correctly", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            const user1BalanceABefore = await tokenA.balanceOf(user1.address);
            const user1BalanceBBefore = await tokenB.balanceOf(user1.address);

            await minimalDex.connect(user1).swap(
                tokenA.target,
                tokenB.target,
                swapAmount
            );

            const user1BalanceAAfter = await tokenA.balanceOf(user1.address);
            const user1BalanceBAfter = await tokenB.balanceOf(user1.address);

            expect(user1BalanceABefore - user1BalanceAAfter).to.equal(swapAmount);
            expect(user1BalanceBAfter).to.be.gt(user1BalanceBBefore);
        });

        it("Should emit Swapped event", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            
            await expect(
                minimalDex.connect(user1).swap(
                    tokenA.target,
                    tokenB.target,
                    swapAmount
                )
            ).to.emit(minimalDex, "Swapped");
        });

        it("Should fail when swapping with no liquidity", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const newToken = await MockERC20.deploy("Mock USDC 2", "USDC2");
            await newToken.waitForDeployment();
            
            await tokenA.connect(user1).approve(minimalDex.target, swapAmount);
            
            await expect(
                minimalDex.connect(user1).swap(
                    tokenA.target,
                    newToken.target,
                    swapAmount
                )
            ).to.be.revertedWith("No liquidity for this pair");
        });

        it("Should fail when swapping same token", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            
            await expect(
                minimalDex.connect(user1).swap(
                    tokenA.target,
                    tokenA.target,
                    swapAmount
                )
            ).to.be.revertedWith("Tokens must be different");
        });

        it("Should fail when swapping zero amount", async function () {
            await expect(
                minimalDex.connect(user1).swap(
                    tokenA.target,
                    tokenB.target,
                    0
                )
            ).to.be.revertedWith("Swap amount must be greater than zero");
        });

        it("Should maintain constant product after swap", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            const poolBefore = await minimalDex.liquidityPools(tokenA.target, tokenB.target);
            const constantProductBefore = poolBefore.reserveA * poolBefore.reserveB;

            await minimalDex.connect(user1).swap(
                tokenA.target,
                tokenB.target,
                swapAmount
            );

            const poolAfter = await minimalDex.liquidityPools(tokenA.target, tokenB.target);
            const constantProductAfter = poolAfter.reserveA * poolAfter.reserveB;

            expect(constantProductAfter).to.be.closeTo(constantProductBefore, constantProductBefore / 1000000n);
        });

        it("Should fail when token transfer fails during swap", async function () {
            const swapAmount = ethers.parseUnits("10", 18);
            
            const MockERC20 = await ethers.getContractFactory("MockERC20");
            const mockToken = await MockERC20.deploy("Mock USDC 4", "USDC4");
            await mockToken.waitForDeployment();

            await mockToken.approve(minimalDex.target, INITIAL_LIQUIDITY);
            await tokenB.approve(minimalDex.target, INITIAL_LIQUIDITY);
            
            await minimalDex.addLiquidity(
                mockToken.target,
                tokenB.target,
                INITIAL_LIQUIDITY,
                INITIAL_LIQUIDITY
            );

            await mockToken.setFailTransfers(true);

            await expect(
                minimalDex.connect(user1).swap(
                    mockToken.target,
                    tokenB.target,
                    swapAmount
                )
            ).to.be.revertedWith("Transfer of input token failed");
        });
    });
}); 