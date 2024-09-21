import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@oasisprotocol/sapphire-hardhat";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    'sapphire-testnet': {
      url: "https://testnet.sapphire.oasis.io",
      accounts: [PRIVATE_KEY],
      chainId: 0x5aff,
    },
  },
};

export default config;