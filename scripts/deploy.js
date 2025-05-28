// Script to deploy the VotingSystem contract to the blockchain
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of VotingSystem contract...");

  // Get the contract factory
  const VotingSystem = await ethers.getContractFactory("VotingSystem");
  
  // Deploy the contract
  console.log("Deploying VotingSystem...");
  const votingSystem = await VotingSystem.deploy();

  // Wait for deployment to finish
  await votingSystem.deployed();
  
  console.log("VotingSystem contract deployed to:", votingSystem.address);
  
  // Save the contract address to a file for easy access
  const deploymentInfo = {
    contractAddress: votingSystem.address,
    deploymentTime: new Date().toISOString(),
    network: network.name,
    deployer: (await ethers.getSigners())[0].address
  };
  
  const deploymentPath = path.join(__dirname, "../deployment-info.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`Deployment information saved to ${deploymentPath}`);
  
  // Update the .env file with the contract address if it exists
  try {
    const envPath = path.join(__dirname, "../.env");
    let envContent = "";
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf8");
      // Replace CONTRACT_ADDRESS if it exists, otherwise append it
      if (envContent.includes("CONTRACT_ADDRESS=")) {
        envContent = envContent.replace(
          /CONTRACT_ADDRESS=.*/,
          `CONTRACT_ADDRESS=${votingSystem.address}`
        );
      } else {
        envContent += `\nCONTRACT_ADDRESS=${votingSystem.address}`;
      }
    } else {
      envContent = `CONTRACT_ADDRESS=${votingSystem.address}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(".env file updated with contract address");
  } catch (error) {
    console.error("Failed to update .env file:", error);
  }
  
  console.log("Deployment completed successfully!");
}

// Execute the deployment function
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });
