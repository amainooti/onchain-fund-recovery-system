import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * AddressClassifier - Identifies address types and known entities
 * 
 * Capabilities:
 * - Detect EOA vs Contract (requires RPC client)
 * - Identify known CEX hot wallets
 * - Cache results to minimize RPC calls
 */
export class AddressClassifier {
  constructor(rpcClient) {
    this.rpcClient = rpcClient;
    
    // Load known CEX wallets
    const cexWalletsPath = join(__dirname, '../data/known-cex-wallets.json');
    this.knownCexWallets = JSON.parse(readFileSync(cexWalletsPath, 'utf-8'));
    
    // Cache to avoid repeated RPC calls
    this.cache = new Map();
  }

  /**
   * Check if address is a known exchange wallet
   * @param {string} address - Ethereum address
   * @returns {Object|null} Exchange info or null
   */
  isExchange(address) {
    const normalized = address.toLowerCase();
    const exchangeInfo = this.knownCexWallets[normalized];
    
    if (exchangeInfo) {
      return {
        isExchange: true,
        name: exchangeInfo.name,
        exchange: exchangeInfo.exchange
      };
    }
    
    return null;
  }

  /**
   * Check if address is a contract
   * @param {string} address - Ethereum address
   * @returns {Promise<boolean>}
   */
  async isContract(address) {
    const normalized = address.toLowerCase();
    
    // Check cache first
    if (this.cache.has(normalized)) {
      return this.cache.get(normalized).isContract;
    }

    try {
      const code = await this.rpcClient.getCode(normalized);
      const isContract = code !== '0x' && code.length > 2;
      
      // Cache result
      this.cache.set(normalized, { isContract, isEOA: !isContract });
      
      return isContract;
    } catch (error) {
      console.warn(`[AddressClassifier] Failed to check contract status for ${address}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if address is an EOA (Externally Owned Account)
   * @param {string} address - Ethereum address
   * @returns {Promise<boolean>}
   */
  async isEOA(address) {
    const isContractAddr = await this.isContract(address);
    return !isContractAddr;
  }

  /**
   * Get complete classification for an address
   * @param {string} address - Ethereum address
   * @returns {Promise<Object>} Classification object
   */
  async classify(address) {
    const normalized = address.toLowerCase();
    
    // Check if it's a known exchange
    const exchangeInfo = this.isExchange(normalized);
    
    // Check if it's a contract
    const isContract = await this.isContract(normalized);
    
    return {
      address: normalized,
      isContract,
      isEOA: !isContract,
      isExchange: !!exchangeInfo,
      exchangeInfo: exchangeInfo || null
    };
  }

  /**
   * Classify multiple addresses in batch
   * @param {Array<string>} addresses - Array of Ethereum addresses
   * @returns {Promise<Array<Object>>} Array of classification objects
   */
  async classifyBatch(addresses) {
    const promises = addresses.map(addr => this.classify(addr));
    return await Promise.all(promises);
  }

  /**
   * Clear the classification cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries())
    };
  }
}

export default AddressClassifier;