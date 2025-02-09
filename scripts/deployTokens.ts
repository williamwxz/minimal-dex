import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying tokens with account: ${deployer.address}`);

  const mockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUSDCContract = await mockERC20.deploy("Mock USDC", "USDC");
  await mockUSDCContract.waitForDeployment();
  console.log(`✅ MockUSDC deployed at: ${await mockUSDCContract.getAddress()}`);

  const mockUSDTContract = await mockERC20.deploy("Mock USDT", "USDT");
  await mockUSDTContract.waitForDeployment();
  console.log(`✅ MockUSDT deployed at: ${await mockUSDTContract.getAddress()}`);

  // Save addresses to a JSON file
  const deployedAddresses = {
    tokenA: await mockUSDCContract.getAddress(),
    tokenB: await mockUSDTContract.getAddress(),
    deployer: deployer.address,
  };

  const filePath = path.join(__dirname, "deployed_addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(deployedAddresses, null, 2));

  console.log(`📄 Addresses saved to ${filePath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});