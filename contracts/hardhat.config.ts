import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const PK = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "cancun"
    }
  },
  networks: {
    sevenchain: {
      url: process.env.SEVEN_CHAIN_RPC || "https://theseven.meme/api/seven-chain/jsonrpc",
      chainId: 70007,
      accounts: [PK]
    },
    hardhat: { chainId: 31337 }
  }
};

export default config;
