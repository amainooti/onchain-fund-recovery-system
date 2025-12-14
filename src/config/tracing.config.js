/**
 * Tracing Engine Configuration
 * 
 * Centralized settings for fund tracing behavior
 */

export const tracingConfig = {
  // Maximum number of hops to trace
  maxHops: 4,

  // Default block range (0 = from genesis)
  defaultBlockRange: {
    start: 0,
    end: 99999999
  },

  // Performance settings
  performance: {
    // Stop tracing a branch when CEX is detected
    stopAtCex: true,
    
    // Include zero-value transactions
    includeZeroValue: false,
    
    // Maximum transactions to process per address (prevents explosion)
    maxTransactionsPerHop: 50,
    
    // Maximum concurrent traces (for parallel processing)
    maxConcurrentTraces: 5,
    
    // Delay between traces (ms) to avoid rate limiting
    traceDelay: 1000
  },

  // Pattern detection settings
  patterns: {
    // Minimum addresses to trigger splitting/consolidation detection
    minAddressesForPattern: 3,
    
    // Risk score weights
    riskWeights: {
      directCex: 10,
      multiHopCex: 25,
      splitting: 40,
      consolidation: 30,
      circular: 50
    }
  },

  // Evidence report settings
  evidence: {
    // Include raw transaction data in reports
    includeRawData: false,
    
    // Include full graph data
    includeGraphData: true,
    
    // Language for reports
    language: 'en',
    
    // Date format
    dateFormat: 'ISO' // ISO, US, EU
  },

  // Logging
  logging: {
    // Log level: 'debug', 'info', 'warn', 'error'
    level: 'info',
    
    // Log to console
    console: true,
    
    // Log to file
    file: false,
    filePath: './logs/tracing.log'
  }
};

export default tracingConfig;