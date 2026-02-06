const CommitmentLandRegistry = artifacts.require("CommitmentLandRegistry");

module.exports = async function (deployer, network, accounts) {
  console.log("===============================================================");
  console.log("🚀 Starting CommitmentLandRegistry Deployment...");
  console.log("   - Network:", network);
  console.log("   - Deployer Account (will become owner):", accounts);
  console.log("   - Registration Authority will be:", accounts);
  console.log("   - Available Accounts:", accounts.length);
  console.log("===============================================================");

  // In OpenZeppelin v4.x, the deployer (accounts) automatically becomes the owner
  const contractOwner = accounts[0];
  const registrationAuthorityAddress = accounts[1];
  
  try {
    // Deploy the contract (no constructor parameters needed for v4.x)
    console.log("📝 Deploying contract (owner will be deployer)...");
    await deployer.deploy(CommitmentLandRegistry);
    
    // Get the deployed contract instance
    const registry = await CommitmentLandRegistry.deployed();
    console.log("✅ Contract deployed at:", registry.address);
    
    // Verify the owner is set correctly
    const currentOwner = await registry.owner();
    console.log("👑 Contract owner:", currentOwner);
    
    // Set the registration authority (only the owner can do this)
    console.log("🔧 Setting registration authority:", registrationAuthorityAddress);
    await registry.setRegistrationAuthority(registrationAuthorityAddress, {from: contractOwner});
    console.log("✅ Registration authority set successfully");
    
    // Verify the setup
    const currentRA = await registry.registrationAuthority();
    
    console.log("===============================================================");
    console.log("✅ CommitmentLandRegistry Deployed Successfully!");
    console.log("   - Contract Address:", registry.address);
    console.log("   - Contract Owner:", currentOwner);
    console.log("   - Registration Authority:", currentRA);
    console.log("===============================================================");
    console.log("➡️  Next Steps:");
    console.log("   1. Copy contract address to your backend/.env file:");
    console.log("      CONTRACT_ADDRESS=" + registry.address);
    console.log("   2. Copy RA private key from Ganache to your backend/.env file:");
    console.log("      REGISTRATION_AUTHORITY_PRIVATE_KEY=[Private key for " + registrationAuthorityAddress + "]");
    console.log("   3. Update your backend server.js to initialize the contract");
    console.log("===============================================================");
    
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
};
