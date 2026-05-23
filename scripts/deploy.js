const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy PunditCard first
  console.log("\nDeploying PunditCard...");
  const PunditCard = await hre.ethers.getContractFactory("PunditCard");
  const punditCard = await PunditCard.deploy();
  await punditCard.waitForDeployment();
  const punditCardAddress = await punditCard.getAddress();
  console.log("PunditCard deployed to:", punditCardAddress);

  // Deploy TheCall with deployer as fee recipient
  console.log("\nDeploying TheCall...");
  const TheCall = await hre.ethers.getContractFactory("TheCall");
  const theCall = await TheCall.deploy(deployer.address);
  await theCall.waitForDeployment();
  const theCallAddress = await theCall.getAddress();
  console.log("TheCall deployed to:", theCallAddress);

  // Authorize TheCall contract to call PunditCard.recordResult
  console.log("\nAuthorizing TheCall on PunditCard...");
  const authTx = await punditCard.addCaller(theCallAddress);
  await authTx.wait();
  console.log("TheCall authorized on PunditCard");

  // Summary
  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("Network:", hre.network.name);
  console.log("PunditCard:", punditCardAddress);
  console.log("TheCall:   ", theCallAddress);
  console.log("=========================================");
  console.log("\nAdd these to your .env file:");
  console.log("NEXT_PUBLIC_THECALL_ADDRESS=" + theCallAddress);
  console.log("NEXT_PUBLIC_PUNDITCARD_ADDRESS=" + punditCardAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
