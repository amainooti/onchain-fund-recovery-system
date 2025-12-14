import dotenv from 'dotenv';
dotenv.config();

export const blockchainConfig = {
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    baseUrl: 'https://api.etherscan.io/api',
    rateLimit: {
      callsPerSecond: 5,
      retryDelay: 1000
    }
  },
  
  rpc: {
    primary: process.env.INFURA_RPC_URL,
    fallbacks: [
      process.env.ANKR_RPC_URL,
    ]
  },

  // Maximum hops for fund tracing
  maxHops: 4,

  // Block range limits per request
  blockRangeLimits: {
    etherscan: 10000, // Etherscan default
    rpc: 1000
  }
};

export default blockchainConfig;