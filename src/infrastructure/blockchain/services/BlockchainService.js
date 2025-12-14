import { EtherscanClient } from '../clients/EtherscanClient.js';
import { FallbackRpcClient } from '../clients/FallbackRpcClient.js';
import { AddressClassifier } from '../utils/AddressClassifier.js';
import { UnifiedTransactionNormalizer } from '../utils/Normalizer.js';

/**
 * BlockchainService - Main orchestration service for blockchain data
 * 
 * Responsibilities:
 * - Fetch transactions from Etherscan (with RPC fallback)
 * - Normalize all data into unified format
 * - Classify addresses (EOA/Contract/CEX)
 * - Merge and sort transactions chronologically
 * 
 * This is the primary interface the tracing engine will use
 */
export class BlockchainService {
  constructor() {
    this.etherscanClient = new EtherscanClient();
    this.rpcClient = new FallbackRpcClient();
    this.normalizer = new UnifiedTransactionNormalizer();
    this.addressClassifier = new AddressClassifier(this.rpcClient);
  }

  /**
   * Get all activity for an address (normal tx, token transfers, internal tx)
   * @param {string} address - Ethereum address to query
   * @param {Object} options - Query options
   * @param {number} options.startBlock - Starting block (default: 0)
   * @param {number} options.endBlock - Ending block (default: latest)
   * @param {boolean} options.includeZeroValue - Include zero-value txs (default: false)
   * @returns {Promise<Object>} Complete activity data
   */
  async getAddressActivity(address, options = {}) {
    const {
      startBlock = 0,
      endBlock = 99999999,
      includeZeroValue = false
    } = options;

    console.log(`[BlockchainService] Fetching activity for ${address}`);
    console.log(`[BlockchainService] Block range: ${startBlock} - ${endBlock}`);

    try {
      // Step 1: Fetch all transaction types from Etherscan
      console.log('[BlockchainService] Fetching from Etherscan...');
      const [normalTxs, tokenTxs, internalTxs] = await Promise.all([
        this._fetchNormalTransactions(address, startBlock, endBlock),
        this._fetchTokenTransfers(address, startBlock, endBlock),
        this._fetchInternalTransactions(address, startBlock, endBlock)
      ]);

      console.log(`[BlockchainService] Fetched: ${normalTxs.length} normal, ${tokenTxs.length} token, ${internalTxs.length} internal`);

      // Step 2: Normalize all transactions
      console.log('[BlockchainService] Normalizing transactions...');
      let normalized = this.normalizer.normalizeBatch(normalTxs, tokenTxs, internalTxs);

      // Step 3: Filter zero-value if requested
      if (!includeZeroValue) {
        normalized = this.normalizer.filterZeroValue(normalized);
      }

      console.log(`[BlockchainService] Normalized ${normalized.length} transactions`);

      // Step 4: Classify the queried address
      const addressClassification = await this.addressClassifier.classify(address);

      return {
        address: address.toLowerCase(),
        classification: addressClassification,
        transactionCount: normalized.length,
        transactions: normalized,
        blockRange: {
          start: startBlock,
          end: endBlock
        },
        fetchedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error(`[BlockchainService] Error fetching activity: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get detailed transaction info (with RPC fallback)
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Detailed transaction data
   */
  async getTransactionDetails(txHash) {
    try {
      console.log(`[BlockchainService] Fetching details for tx: ${txHash}`);

      // Try to get transaction and receipt from RPC
      const [tx, receipt] = await Promise.all([
        this.rpcClient.getTransaction(txHash),
        this.rpcClient.getTransactionReceipt(txHash)
      ]);

      // Get block for timestamp
      const block = await this.rpcClient.getBlock(tx.blockNumber);

      // Normalize
      const normalized = this.normalizer.normalizeRpcTransaction(tx, receipt, block);

      // Classify addresses
      const [fromClassification, toClassification] = await Promise.all([
        this.addressClassifier.classify(normalized.from),
        normalized.to ? this.addressClassifier.classify(normalized.to) : null
      ]);

      return {
        transaction: normalized,
        fromAddress: fromClassification,
        toAddress: toClassification,
        raw: {
          transaction: tx,
          receipt: receipt,
          block: block
        }
      };

    } catch (error) {
      console.error(`[BlockchainService] Error fetching transaction details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Classify an address
   * @param {string} address - Ethereum address
   * @returns {Promise<Object>} Classification data
   */
  async classifyAddress(address) {
    return await this.addressClassifier.classify(address);
  }

  /**
   * Classify multiple addresses
   * @param {Array<string>} addresses - Array of addresses
   * @returns {Promise<Array<Object>>} Array of classifications
   */
  async classifyAddresses(addresses) {
    return await this.addressClassifier.classifyBatch(addresses);
  }

  /**
   * Get current block number
   * @returns {Promise<number>}
   */
  async getCurrentBlockNumber() {
    return await this.rpcClient.getBlockNumber();
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Fetch normal transactions with fallback
   */
  async _fetchNormalTransactions(address, startBlock, endBlock) {
    try {
      return await this.etherscanClient.getNormalTransactions(address, startBlock, endBlock);
    } catch (error) {
      console.warn(`[BlockchainService] Etherscan normal tx failed, attempting RPC fallback: ${error.message}`);
      return await this._fetchNormalTransactionsViaRpc(address, startBlock, endBlock);
    }
  }

  /**
   * Fetch token transfers with fallback
   */
  async _fetchTokenTransfers(address, startBlock, endBlock) {
    try {
      return await this.etherscanClient.getERC20Transfers(address, startBlock, endBlock);
    } catch (error) {
      console.warn(`[BlockchainService] Etherscan token tx failed, attempting RPC fallback: ${error.message}`);
      return await this._fetchTokenTransfersViaRpc(address, startBlock, endBlock);
    }
  }

  /**
   * Fetch internal transactions (Etherscan only - no RPC fallback for this)
   */
  async _fetchInternalTransactions(address, startBlock, endBlock) {
    try {
      return await this.etherscanClient.getInternalTransactions(address, startBlock, endBlock);
    } catch (error) {
      console.warn(`[BlockchainService] Etherscan internal tx failed: ${error.message}`);
      console.warn('[BlockchainService] Internal transactions not available via RPC, returning empty array');
      return [];
    }
  }

  /**
   * RPC fallback for normal transactions (simplified - gets recent txs only)
   */
  async _fetchNormalTransactionsViaRpc(address, startBlock, endBlock) {
    console.log('[BlockchainService] RPC fallback for normal txs not fully implemented');
    console.log('[BlockchainService] This would require scanning blocks and filtering - expensive operation');
    return [];
  }

  /**
   * RPC fallback for token transfers using getLogs
   */
  async _fetchTokenTransfersViaRpc(address, startBlock, endBlock) {
    try {
      // ERC20 Transfer event signature
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
      
      // Build filter for transfers involving this address
      const filter = {
        fromBlock: startBlock,
        toBlock: endBlock,
        topics: [
          transferTopic,
          null, // from (any)
          null  // to (any)
        ]
      };

      const logs = await this.rpcClient.getLogs(filter);
      
      // Filter logs where address is involved
      const relevantLogs = logs.filter(log => {
        const from = '0x' + log.topics[1].slice(26);
        const to = '0x' + log.topics[2].slice(26);
        return from.toLowerCase() === address.toLowerCase() || 
               to.toLowerCase() === address.toLowerCase();
      });

      console.log(`[BlockchainService] RPC fallback found ${relevantLogs.length} token transfers`);
      return relevantLogs;

    } catch (error) {
      console.error(`[BlockchainService] RPC token transfer fallback failed: ${error.message}`);
      return [];
    }
  }
}

export default BlockchainService;