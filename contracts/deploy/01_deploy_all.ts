import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  console.log(`\nDeploying to chain ${network.chainId.toString()} from ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  // 1. GameCurrency (ERC-20 in-game token)
  const Currency = await ethers.getContractFactory("GameCurrency");
  const currency = await Currency.deploy("Seven Gold", "SGOLD");
  await currency.waitForDeployment();
  const currencyAddr = await currency.getAddress();
  console.log("GameCurrency (SGOLD):  ", currencyAddr);

  // 2. GameItemNFT (ERC-1155 batch-mint)
  const NFT = await ethers.getContractFactory("GameItemNFT");
  const nft = await NFT.deploy("https://theseven.meme/api/gaming/metadata/{id}.json");
  await nft.waitForDeployment();
  const nftAddr = await nft.getAddress();
  console.log("GameItemNFT (ERC-1155):", nftAddr);

  // 3. BatchMintRewards (high-frequency bulk rewards)
  const Batch = await ethers.getContractFactory("BatchMintRewards");
  const batch = await Batch.deploy("https://theseven.meme/api/gaming/metadata/{id}.json");
  await batch.waitForDeployment();
  const batchAddr = await batch.getAddress();
  console.log("BatchMintRewards:      ", batchAddr);

  // 4. SessionKeys (holy grail — zero wallet popups)
  const SK = await ethers.getContractFactory("SessionKeys");
  const sessionKeys = await SK.deploy();
  await sessionKeys.waitForDeployment();
  const skAddr = await sessionKeys.getAddress();
  console.log("SessionKeys:           ", skAddr);

  // 5. EscrowMatch (PvP wager settlement ~1s)
  const Escrow = await ethers.getContractFactory("EscrowMatch");
  const escrow = await Escrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("EscrowMatch:           ", escrowAddr);

  // 6. StateCompression (near-zero gas game state)
  const SC = await ethers.getContractFactory("StateCompression");
  const sc = await SC.deploy(deployer.address);
  await sc.waitForDeployment();
  const scAddr = await sc.getAddress();
  console.log("StateCompression:      ", scAddr);

  // Post-deploy wiring
  await currency.setMinter(nftAddr, true);
  await batch.setOperator(deployer.address, true);
  console.log("\nPost-deploy wiring complete.");

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify({
    network: network.chainId.toString(),
    contracts: {
      GameCurrency:     currencyAddr,
      GameItemNFT:      nftAddr,
      BatchMintRewards: batchAddr,
      SessionKeys:      skAddr,
      EscrowMatch:      escrowAddr,
      StateCompression: scAddr
    }
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });