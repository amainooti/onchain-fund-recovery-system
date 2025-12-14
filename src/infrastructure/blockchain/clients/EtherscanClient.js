import axios from 'axios';
import { blockchainConfig } from '../../../config/blockchain.config.js';

/**
 * EtherscanClient - Handles all Etherscan API interactions
 * 
 * Provides methods to fetch:
 * - Normal transactions
 * - ERC20 token transfers
 * - Internal transactions
 * 
 * Rate limiting: 5 calls/second (free tier)
 * Caller is responsible for retry logic
 */
export class EtherscanClient {
  constructor(apiKey = blockchainConfig.etherscan.apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.etherscan.io/v2/api';
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000
    });
  }

  /**
   * Generic request handler for Etherscan API
   */
  async _request(params) {
    try {
      const response = await this.axiosInstance.get('', {
        params: {
          chainid: 1, // Ethereum mainnet
          ...params,
          apikey: this.apiKey
        }
      });

      if (response.data.status === '0' && response.data.message === 'NOTOK') {
        throw new Error(`Etherscan API Error: ${response.data.result}`);
      }

      return response.data.result;
    } catch (error) {
      if (error.response) {
        throw new Error(`Etherscan HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Get normal transactions for an address
   * @param {string} address - Ethereum address
   * @param {number} startBlock - Starting block number (optional)
   * @param {number} endBlock - Ending block number (optional)
   * @returns {Promise<Array>} Array of transaction objects
   */
  async getNormalTransactions(address, startBlock = 0, endBlock = 99999999) {
    const params = {
      module: 'account',
      action: 'txlist',
      address: address.toLowerCase(),
      startblock: startBlock,
      endblock: endBlock,
      sort: 'asc'
    };

    return await this._request(params);
  }

  /**
   * Get ERC20 token transfers for an address
   * @param {string} address - Ethereum address
   * @param {number} startBlock - Starting block number (optional)
   * @param {number} endBlock - Ending block number (optional)
   * @returns {Promise<Array>} Array of token transfer objects
   */
  async getERC20Transfers(address, startBlock = 0, endBlock = 99999999) {
    const params = {
      module: 'account',
      action: 'tokentx',
      address: address.toLowerCase(),
      startblock: startBlock,
      endblock: endBlock,
      sort: 'asc'
    };

    return await this._request(params);
  }

  /**
   * Get internal transactions for an address
   * @param {string} address - Ethereum address
   * @param {number} startBlock - Starting block number (optional)
   * @param {number} endBlock - Ending block number (optional)
   * @returns {Promise<Array>} Array of internal transaction objects
   */
  async getInternalTransactions(address, startBlock = 0, endBlock = 99999999) {
    const params = {
      module: 'account',
      action: 'txlistinternal',
      address: address.toLowerCase(),
      startblock: startBlock,
      endblock: endBlock,
      sort: 'asc'
    };

    return await this._request(params);
  }

  /**
   * Get ETH balance for an address
   * @param {string} address - Ethereum address
   * @returns {Promise<string>} Balance in wei
   */
  async getBalance(address) {
    const params = {
      module: 'account',
      action: 'balance',
      address: address.toLowerCase(),
      tag: 'latest'
    };

    return await this._request(params);
  }

  /**
   * Get contract ABI (useful for contract verification)
   * @param {string} address - Contract address
   * @returns {Promise<string>} Contract ABI JSON
   */
  async getContractABI(address) {
    const params = {
      module: 'contract',
      action: 'getabi',
      address: address.toLowerCase()
    };

    return await this._request(params);
  }
}

export default EtherscanClient;