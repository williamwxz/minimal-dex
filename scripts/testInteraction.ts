import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main(): Promise<void> {
  // Load .env variables
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY is not set in .env file");
  }

  // Connect to Hardhat Local Node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Load deployed contract addresses
  const filePath = path.join(__dirname, "deployed_addresses.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("❌ deployed_addresses.json not found. Run deployment scripts first.");
  }

  const deployedAddresses: { tokenA: string; tokenB: string; dex: string } = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tokenAAddress: string = deployedAddresses.tokenA;
  const tokenBAddress: string = deployedAddresses.tokenB;
  const dexAddress: string = deployedAddresses.dex;

  console.log(`🔍 Using TokenA: ${tokenAAddress}`);
  console.log(`🔍 Using TokenB: ${tokenBAddress}`);
  console.log(`🔍 Using MinimalDex: ${dexAddress}`);

  // Attach to Token Contracts
  const tokenA = await ethers.getContractAt("MockERC20", tokenAAddress, deployer);
  const tokenB = await ethers.getContractAt("MockERC20", tokenBAddress, deployer);
  const dex = await ethers.getContractAt("MinimalDex", dexAddress, deployer);

  // Check Balance
  const balanceA = await tokenA.balanceOf(deployer.address);
  console.log(`💰 TokenA Balance: ${ethers.formatUnits(balanceA, 18)} Tokens`);

  // Get the current nonce
  let nonce = await provider.getTransactionCount(deployer.address);

  // Check and approve TokenA if needed
  const requiredAllowanceA = ethers.parseUnits("110", 18);
  const currentAllowanceA = await tokenA.allowance(deployer.address, dex.target);
  if (currentAllowanceA < requiredAllowanceA) {
    console.log("🔹 Approving DEX to spend 110 TokenA...");
    const tx1 = await tokenA.approve(dex.target, requiredAllowanceA, { nonce: nonce++ });
    await tx1.wait();
    console.log("✅ Approved DEX for TokenA");
  } else {
    console.log("✅ Sufficient allowance for TokenA");
  }

  // Check and approve TokenB if needed
  const requiredAllowanceB = ethers.parseUnits("60", 18);
  const currentAllowanceB = await tokenB.allowance(deployer.address, dex.target);
  if (currentAllowanceB < requiredAllowanceB) {
    console.log("🔹 Approving DEX to spend 60 TokenB...");
    const tx2 = await tokenB.approve(dex.target, requiredAllowanceB, { nonce: nonce++ });
    await tx2.wait();
    console.log("✅ Approved DEX for TokenB");
  } else {
    console.log("✅ Sufficient allowance for TokenB");
  }

  // Add Liquidity
  console.log("🔹 Adding Liquidity...");
  const tx3 = await dex.addLiquidity(tokenAAddress, tokenBAddress, ethers.parseUnits("100", 18), ethers.parseUnits("50", 18), { nonce: nonce++ });
  await tx3.wait();
  console.log("✅ Liquidity Added");

  // Swap 10 TokenA for TokenB
  console.log("🔹 Swapping 10 TokenA for TokenB...");
  const tx4 = await dex.swap(tokenAAddress, tokenBAddress, ethers.parseUnits("10", 18), { nonce: nonce++ });
  await tx4.wait();
  console.log("✅ Swap Complete");
  // Check New Balances
  const newBalanceA = await tokenA.balanceOf(deployer.address);
  const newBalanceB = await tokenB.balanceOf(deployer.address);
  console.log(`💰 New TokenA Balance: ${ethers.formatUnits(newBalanceA, 18)} Tokens`);
  console.log(`💰 New TokenB Balance: ${ethers.formatUnits(newBalanceB, 18)} Tokens`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
}); 