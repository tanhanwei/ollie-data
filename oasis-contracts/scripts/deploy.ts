import { ethers } from "hardhat";

async function main() {
  const DataMarketplace = await ethers.getContractFactory("DataMarketplace");
  const dataMarketplace = await DataMarketplace.deploy();

  await dataMarketplace.waitForDeployment();

  console.log("DataMarketplace deployed to:", await dataMarketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});