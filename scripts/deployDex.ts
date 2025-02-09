import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying MinimalDex with account: ${deployer.address}`);

  const filePath = path.join(__dirname, "deployed_addresses.json");
  if (!fs.existsSync(filePath)) {
    console.error("❌ Error: Token addresses file not found. Run deployTokens.ts first.");
    process.exit(1);
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const tokenAAddress = deployedAddresses.tokenA;
  const tokenBAddress = deployedAddresses.tokenB;

  console.log(`Using TokenA: ${tokenAAddress}`);
  console.log(`Using TokenB: ${tokenBAddress}`);

  const MinimalDex = await ethers.getContractFactory("MinimalDex");
  const minimalDex = await MinimalDex.deploy();
  await minimalDex.waitForDeployment();
  console.log(`✅ MinimalDex deployed at: ${await minimalDex.getAddress()}`);

  deployedAddresses.dex = await minimalDex.getAddress();
  fs.writeFileSync(filePath, JSON.stringify(deployedAddresses, null, 2));

  console.log(`📄 Updated addresses saved to ${filePath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});