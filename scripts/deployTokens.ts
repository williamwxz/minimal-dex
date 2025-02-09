import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying tokens with account: ${deployer.address}`);

  const mockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDCContract = await mockUSDC.deploy();
  await mockUSDCContract.waitForDeployment();
  console.log(`✅ MockUSDC deployed at: ${await mockUSDCContract.getAddress()}`);

  const mockUSDT = await ethers.getContractFactory("MockUSDT"); 
  const mockUSDTContract = await mockUSDT.deploy();
  await mockUSDTContract.waitForDeployment();
  console.log(`✅ MockUSDT deployed at: ${await mockUSDTContract.getAddress()}`);

  // Save addresses to a JSON file
  const deployedAddresses = {
    tokenA: await mockUSDCContract.getAddress(),
    tokenB: await mockUSDTContract.getAddress(),
  };

  const filePath = path.join(__dirname, "deployed_addresses.json");
  fs.writeFileSync(filePath, JSON.stringify(deployedAddresses, null, 2));

  console.log(`📄 Addresses saved to ${filePath}`);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});