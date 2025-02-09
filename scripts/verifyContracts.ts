import { run } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  // Load deployed contract addresses
  const filePath = path.join(__dirname, "deployed_addresses.json");
  if (!fs.existsSync(filePath)) {
    console.error("❌ Error: deployed_addresses.json not found. Run deployment scripts first.");
    process.exit(1);
  }

  const deployedAddresses = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  try {
    // Verify TokenA
    console.log(`🔹 Verifying TokenA at ${deployedAddresses.tokenA}...`);
    await run("verify:verify", {
      address: deployedAddresses.tokenA,
      constructorArguments: ["Mock USDC", "USDC"],
    });
    console.log("✅ TokenA verified successfully!");

    // Verify MyTokenB  
    console.log(`🔹 Verifying MyTokenB at ${deployedAddresses.tokenB}...`);
    await run("verify:verify", {
      address: deployedAddresses.tokenB,
      constructorArguments: ["Mock USDT", "USDT"],
    });
    console.log("✅ TokenB verified successfully!");

    // Verify MinimalDex
    console.log(`🔹 Verifying MinimalDex at ${deployedAddresses.dex}...`);
    await run("verify:verify", {
      address: deployedAddresses.dex,
      constructorArguments: [],
    });
    console.log("✅ MinimalDex verified successfully!");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exitCode = 1;
});