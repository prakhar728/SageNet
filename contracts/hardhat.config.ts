import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const DEFAULT_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Hardhat default account

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.26",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Hardhat local network (default)
    hardhat: {},

    // Local development network
    localhost: {
      url: "http://127.0.0.1:8545",
    },

    // EDU Chain Mainnet (Arbitrum Orbit)
    educhain: {
      url:
        process.env.EDUCHAIN_RPC_URL ||
        "https://rpc.edu-chain.raas.gelato.cloud",
      accounts: [process.env.PRIVATE_KEY || DEFAULT_PRIVATE_KEY],
      chainId: 41923,
      gasPrice: "auto",
    },

    // EDU Chain Testnet (Sepolia based)
    educhain_testnet: {
      url:
        "https://rpc.open-campus-codex.gelato.digital",
      accounts: [process.env.PRIVATE_KEY || DEFAULT_PRIVATE_KEY],
      chainId: 656476,
      gas: 500000000
    },

    // Arbitrum - Settlement layer for EDU Chain
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.PRIVATE_KEY || DEFAULT_PRIVATE_KEY],
      chainId: 42161,
    },

    // Sepolia - Settlement layer for EDU Chain Testnet
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://sepolia.infura.io/v3/YOUR_INFURA_KEY",
      accounts: [process.env.PRIVATE_KEY || DEFAULT_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: {
      // For verification on EDU Chain Mainnet & Testnet, you'll need to use the custom block explorer URLs
      // defined in the network configs above
      arbitrum: process.env.ARBITRUM_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "educhain",
        chainId: 41923,
        urls: {
          apiURL:
            process.env.EDUCHAIN_EXPLORER_API ||
            "https://explorer.edu-chain.raas.gelato.cloud/api",
          browserURL:
            process.env.EDUCHAIN_EXPLORER_URL ||
            "https://explorer.edu-chain.raas.gelato.cloud",
        },
      },
      {
        network: "educhain_testnet",
        chainId: 656476,
        urls: {
          apiURL:
            process.env.EDUCHAIN_TESTNET_EXPLORER_API ||
            "https://explorer.open-campus-codex.gelato.digital/api",
          browserURL:
            process.env.EDUCHAIN_TESTNET_EXPLORER_URL ||
            "https://explorer.open-campus-codex.gelato.digital",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
  },
};

export default config;
