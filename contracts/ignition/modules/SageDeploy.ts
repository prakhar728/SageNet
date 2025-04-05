// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying SageNet contracts...");

  // Deploy SageNetCore first
  const SageNetCore = await ethers.getContractFactory("SageNetCore");
  const sageNetCore = await SageNetCore.deploy();
  await sageNetCore.waitForDeployment();
  
  const sageNetCoreAddress = await sageNetCore.getAddress();
  console.log(`SageNetCore deployed to: ${sageNetCoreAddress}`);

  // Deploy SageNetReview with the SageNetCore address
  const SageNetReview = await ethers.getContractFactory("SageNetReview");
  const sageNetReview = await SageNetReview.deploy(sageNetCoreAddress);
  await sageNetReview.waitForDeployment();
  
  const sageNetReviewAddress = await sageNetReview.getAddress();
  console.log(`SageNetReview deployed to: ${sageNetReviewAddress}`);

  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });