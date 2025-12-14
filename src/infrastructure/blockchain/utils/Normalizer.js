import { ethers } from 'ethers';

/**
 * UnifiedTransactionNormalizer - Converts raw blockchain data into a standard format
 * 
 * Handles data from:
 * - Etherscan API (normal tx, token transfers, internal tx)
 * - RPC providers
 * 
 * Output format is consistent regardless of source
 */
export class UnifiedTransactionNormalizer {
  /**
   * Normalize Etherscan normal transaction
   * @param {Object} tx - Raw Etherscan transaction
   * @returns {Object} Normalized transaction
   */
  normalizeEtherscanNormalTx(tx) {
    return {
      txHash: tx.hash,
      from: tx.from.toLowerCase(),
      to: tx.to ? tx.to.toLowerCase() : null,
      value: ethers.formatEther(tx.value),
      valueWei: tx.value,
      token: null, // Native ETH
      tokenSymbol: 'ETH',
      type: 'native',
      blockNumber: parseInt(tx.blockNumber),
      timestamp: parseInt(tx.timeStamp),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      isError: tx.isError === '1',
      methodId: tx.methodId || null,
      functionName: tx.functionName || null
    };
  }

  /**
   * Normalize Etherscan ERC20 token transfer
   * @param {Object} tx - Raw Etherscan token transfer
   * @returns {Object} Normalized transaction
   */
  normalizeEtherscanTokenTransfer(tx) {
    const decimals = parseInt(tx.tokenDecimal) || 18;
    const value = ethers.formatUnits(tx.value, decimals);

    return {
      txHash: tx.hash,
      from: tx.from.toLowerCase(),
      to: tx.to.toLowerCase(),
      value: value,
      valueWei: tx.value,
      token: tx.contractAddress.toLowerCase(),
      tokenSymbol: tx.tokenSymbol,
      tokenName: tx.tokenName,
      tokenDecimals: decimals,
      type: 'erc20',
      blockNumber: parseInt(tx.blockNumber),
      timestamp: parseInt(tx.timeStamp),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice
    };
  }

  /**
   * Normalize Etherscan internal transaction
   * @param {Object} tx - Raw Etherscan internal transaction
   * @returns {Object} Normalized transaction
   */
  normalizeEtherscanInternalTx(tx) {
    return {
      txHash: tx.hash,
      from: tx.from.toLowerCase(),
      to: tx.to ? tx.to.toLowerCase() : null,
      value: ethers.formatEther(tx.value),
      valueWei: tx.value,
      token: null, // Internal transfers are ETH
      tokenSymbol: 'ETH',
      type: 'internal',
      blockNumber: parseInt(tx.blockNumber),
      timestamp: parseInt(tx.timeStamp),
      gasUsed: tx.gas,
      gasPrice: null, // Not available for internal tx
      traceId: tx.traceId || null,
      isError: tx.isError === '1',
      errCode: tx.errCode || null
    };
  }

  /**
   * Normalize RPC transaction
   * @param {Object} tx - Raw RPC transaction
   * @param {Object} receipt - Transaction receipt
   * @param {Object} block - Block containing the transaction
   * @returns {Object} Normalized transaction
   */
  normalizeRpcTransaction(tx, receipt, block) {
    return {
      txHash: tx.hash,
      from: tx.from.toLowerCase(),
      to: tx.to ? tx.to.toLowerCase() : null,
      value: ethers.formatEther(tx.value),
      valueWei: tx.value.toString(),
      token: null, // RPC native transfer
      tokenSymbol: 'ETH',
      type: 'native',
      blockNumber: tx.blockNumber,
      timestamp: block ? block.timestamp : null,
      gasUsed: receipt ? receipt.gasUsed.toString() : null,
      gasPrice: tx.gasPrice ? tx.gasPrice.toString() : null,
      nonce: tx.nonce,
      data: tx.data,
      status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending'
    };
  }

  /**
   * Normalize RPC log (for ERC20 transfers)
   * @param {Object} log - Raw RPC log
   * @param {Object} block - Block containing the log
   * @returns {Object} Normalized transaction
   */
  normalizeRpcLog(log, block) {
    // ERC20 Transfer event signature
    const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    if (log.topics[0] !== transferSignature) {
      return null; // Not a transfer event
    }

    // Decode topics (from, to)
    const from = '0x' + log.topics[1].slice(26);
    const to = '0x' + log.topics[2].slice(26);
    const value = ethers.getBigInt(log.data);

    return {
      txHash: log.transactionHash,
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      value: ethers.formatUnits(value, 18), // Default to 18, update if known
      valueWei: value.toString(),
      token: log.address.toLowerCase(),
      tokenSymbol: null, // Would need separate lookup
      type: 'erc20',
      blockNumber: log.blockNumber,
      timestamp: block ? block.timestamp : null,
      logIndex: log.logIndex
    };
  }

  /**
   * Batch normalize Etherscan transactions
   * @param {Array} normalTxs - Normal transactions
   * @param {Array} tokenTxs - Token transfers
   * @param {Array} internalTxs - Internal transactions
   * @returns {Array} Normalized and merged transactions
   */
  normalizeBatch(normalTxs = [], tokenTxs = [], internalTxs = []) {
    const normalized = [];

    // Normalize each type
    normalTxs.forEach(tx => {
      normalized.push(this.normalizeEtherscanNormalTx(tx));
    });

    tokenTxs.forEach(tx => {
      normalized.push(this.normalizeEtherscanTokenTransfer(tx));
    });

    internalTxs.forEach(tx => {
      normalized.push(this.normalizeEtherscanInternalTx(tx));
    });

    // Sort by timestamp, then by block number
    normalized.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.blockNumber - b.blockNumber;
    });

    return normalized;
  }

  /**
   * Filter out zero-value transactions
   * @param {Array} transactions - Normalized transactions
   * @returns {Array} Filtered transactions
   */
  filterZeroValue(transactions) {
    return transactions.filter(tx => {
      const value = parseFloat(tx.value);
      return value > 0;
    });
  }

  /**
   * Group transactions by hash
   * @param {Array} transactions - Normalized transactions
   * @returns {Object} Transactions grouped by hash
   */
  groupByHash(transactions) {
    const grouped = {};
    
    transactions.forEach(tx => {
      if (!grouped[tx.txHash]) {
        grouped[tx.txHash] = [];
      }
      grouped[tx.txHash].push(tx);
    });

    return grouped;
  }
}

export default UnifiedTransactionNormalizer;