import { ethers } from 'ethers';

/**
 * Validation utilities for blockchain data
 */

/**
 * Validate Ethereum address
 * @param {string} address - Address to validate
 * @returns {Object} { valid: boolean, checksummed: string|null, error: string|null }
 */
export function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return {
      valid: false,
      checksummed: null,
      error: 'Address must be a non-empty string'
    };
  }

  // Remove whitespace
  address = address.trim();

  // Check if it looks like an Ethereum address
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return {
      valid: false,
      checksummed: null,
      error: 'Invalid address format. Must be 0x followed by 40 hex characters'
    };
  }

  try {
    // ethers.getAddress() validates and returns checksummed version
    const checksummed = ethers.getAddress(address);
    return {
      valid: true,
      checksummed,
      error: null
    };
  } catch (error) {
    return {
      valid: false,
      checksummed: null,
      error: `Invalid address checksum: ${error.message}`
    };
  }
}

/**
 * Validate transaction hash
 * @param {string} txHash - Transaction hash to validate
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateTxHash(txHash) {
  if (!txHash || typeof txHash !== 'string') {
    return {
      valid: false,
      error: 'Transaction hash must be a non-empty string'
    };
  }

  txHash = txHash.trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return {
      valid: false,
      error: 'Invalid transaction hash format. Must be 0x followed by 64 hex characters'
    };
  }

  return {
    valid: true,
    error: null
  };
}

/**
 * Validate block number
 * @param {number|string} blockNumber - Block number to validate
 * @returns {Object} { valid: boolean, blockNumber: number|null, error: string|null }
 */
export function validateBlockNumber(blockNumber) {
  if (blockNumber === null || blockNumber === undefined) {
    return {
      valid: false,
      blockNumber: null,
      error: 'Block number is required'
    };
  }

  const num = parseInt(blockNumber);
  
  if (isNaN(num) || num < 0) {
    return {
      valid: false,
      blockNumber: null,
      error: 'Block number must be a non-negative integer'
    };
  }

  return {
    valid: true,
    blockNumber: num,
    error: null
  };
}

/**
 * Validate block range
 * @param {number} startBlock - Start block
 * @param {number} endBlock - End block
 * @returns {Object} { valid: boolean, error: string|null }
 */
export function validateBlockRange(startBlock, endBlock) {
  const startValidation = validateBlockNumber(startBlock);
  if (!startValidation.valid) {
    return {
      valid: false,
      error: `Invalid start block: ${startValidation.error}`
    };
  }

  const endValidation = validateBlockNumber(endBlock);
  if (!endValidation.valid) {
    return {
      valid: false,
      error: `Invalid end block: ${endValidation.error}`
    };
  }

  if (startValidation.blockNumber > endValidation.blockNumber) {
    return {
      valid: false,
      error: 'Start block must be less than or equal to end block'
    };
  }

  return {
    valid: true,
    error: null
  };
}

export default {
  validateAddress,
  validateTxHash,
  validateBlockNumber,
  validateBlockRange
};