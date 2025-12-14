import { ethers } from 'ethers';

/**
 * RpcClient - Handles direct RPC interactions with Ethereum nodes
 * 
 * Provides methods for:
 * - Transaction queries
 * - Block queries
 * - Log queries
 * - Balance queries
 * - Contract code detection
 */
export class RpcClient {
  constructor(rpcUrl) {
    if (!rpcUrl) {
      throw new Error('RPC URL is required');
    }
    
    this.rpcUrl = rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get transaction by hash
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction object
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error(`Transaction not found: ${txHash}`);
      }
      return tx;
    } catch (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction receipt
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error(`Transaction receipt not found: ${txHash}`);
      }
      return receipt;
    } catch (error) {
      throw new Error(`Failed to fetch receipt: ${error.message}`);
    }
  }

  /**
   * Get block by number or hash
   * @param {number|string} blockNumberOrHash - Block number or hash
   * @returns {Promise<Object>} Block object
   */
  async getBlock(blockNumberOrHash) {
    try {
      const block = await this.provider.getBlock(blockNumberOrHash);
      if (!block) {
        throw new Error(`Block not found: ${blockNumberOrHash}`);
      }
      return block;
    } catch (error) {
      throw new Error(`Failed to fetch block: ${error.message}`);
    }
  }

  /**
   * Get logs (events) for a filter
   * @param {Object} filter - Filter object { fromBlock, toBlock, address, topics }
   * @returns {Promise<Array>} Array of log objects
   */
  async getLogs(filter) {
    try {
      return await this.provider.getLogs(filter);
    } catch (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
  }

  /**
   * Get ETH balance for an address
   * @param {string} address - Ethereum address
   * @returns {Promise<bigint>} Balance in wei
   */
  async getBalance(address) {
    try {
      return await this.provider.getBalance(address);
    } catch (error) {
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  /**
   * Get contract code at address
   * Used to determine if address is a contract or EOA
   * @param {string} address - Ethereum address
   * @returns {Promise<string>} Contract bytecode (0x if EOA)
   */
  async getCode(address) {
    try {
      return await this.provider.getCode(address);
    } catch (error) {
      throw new Error(`Failed to fetch code: ${error.message}`);
    }
  }

  /**
   * Get current block number
   * @returns {Promise<number>} Current block number
   */
  async getBlockNumber() {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      throw new Error(`Failed to fetch block number: ${error.message}`);
    }
  }

  /**
   * Get transaction count for address (nonce)
   * @param {string} address - Ethereum address
   * @returns {Promise<number>} Transaction count
   */
  async getTransactionCount(address) {
    try {
      return await this.provider.getTransactionCount(address);
    } catch (error) {
      throw new Error(`Failed to fetch transaction count: ${error.message}`);
    }
  }

  /**
   * Check if provider is connected
   * @returns {Promise<boolean>}
   */
  async isConnected() {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default RpcClient;