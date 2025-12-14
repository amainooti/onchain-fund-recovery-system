import { RpcClient } from './RpcClient.js';
import { blockchainConfig } from '../../../config/blockchain.config.js';

/**
 * FallbackRpcClient - Implements automatic failover between RPC providers
 * 
 * Tries primary RPC (Infura), then falls back to public RPCs in order
 * Logs which provider was used for debugging
 */
export class FallbackRpcClient {
  constructor() {
    const { primary, fallbacks } = blockchainConfig.rpc;
    
    if (!primary) {
      throw new Error('Primary RPC URL is required');
    }

    // Initialize all RPC clients
    this.clients = [
      { name: 'Infura (Primary)', client: new RpcClient(primary) },
      ...fallbacks.filter(url => url).map((url, idx) => ({
        name: `Fallback ${idx + 1}`,
        client: new RpcClient(url)
      }))
    ];

    if (this.clients.length === 0) {
      throw new Error('At least one RPC URL must be configured');
    }
  }

  /**
   * Execute a method with automatic failover
   * @param {string} methodName - Name of the RPC method to call
   * @param {Array} args - Arguments to pass to the method
   * @returns {Promise<any>} Result from the RPC call
   */
  async _executeWithFallback(methodName, ...args) {
    let lastError;

    for (const { name, client } of this.clients) {
      try {
        console.log(`[FallbackRpcClient] Trying ${name} for ${methodName}`);
        const result = await client[methodName](...args);
        console.log(`[FallbackRpcClient] Success with ${name}`);
        return result;
      } catch (error) {
        console.warn(`[FallbackRpcClient] ${name} failed for ${methodName}: ${error.message}`);
        lastError = error;
        // Continue to next provider
      }
    }

    // All providers failed
    throw new Error(`All RPC providers failed for ${methodName}: ${lastError.message}`);
  }

  /**
   * Get transaction by hash
   */
  async getTransaction(txHash) {
    return this._executeWithFallback('getTransaction', txHash);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash) {
    return this._executeWithFallback('getTransactionReceipt', txHash);
  }

  /**
   * Get block by number or hash
   */
  async getBlock(blockNumberOrHash) {
    return this._executeWithFallback('getBlock', blockNumberOrHash);
  }

  /**
   * Get logs (events) for a filter
   */
  async getLogs(filter) {
    return this._executeWithFallback('getLogs', filter);
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(address) {
    return this._executeWithFallback('getBalance', address);
  }

  /**
   * Get contract code at address
   */
  async getCode(address) {
    return this._executeWithFallback('getCode', address);
  }

  /**
   * Get current block number
   */
  async getBlockNumber() {
    return this._executeWithFallback('getBlockNumber');
  }

  /**
   * Get transaction count for address
   */
  async getTransactionCount(address) {
    return this._executeWithFallback('getTransactionCount', address);
  }

  /**
   * Check if any provider is connected
   */
  async isConnected() {
    for (const { client } of this.clients) {
      if (await client.isConnected()) {
        return true;
      }
    }
    return false;
  }
}

export default FallbackRpcClient;