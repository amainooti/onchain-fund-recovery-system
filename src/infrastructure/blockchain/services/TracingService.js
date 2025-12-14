import { BlockchainService } from './BlockchainService.js';
import { Trace } from '../../../models/Trace.js';
import { TraceResult } from '../../../models/TraceResult.js';
import { GraphBuilder } from '../../../utils/GraphBuilder.js';
import { PathAnalyzer } from '../../../utils/PathAnalyzer.js';


/**
 * TracingService - Core fund tracing engine
 * 
 * Features:
 * - Multi-hop recursive tracing (up to 4 hops)
 * - CEX detection at each hop
 * - Circular reference prevention
 * - Parallel processing of branches
 * - Evidence collection
 */
export class TracingService {
  constructor() {
    this.blockchainService = new BlockchainService();
    this.graphBuilder = new GraphBuilder();
    this.pathAnalyzer = new PathAnalyzer();
  }

  /**
   * Trace funds from an address
   * @param {string} address - Origin address to trace
   * @param {Object} options - Tracing options
   * @returns {Promise<TraceResult>} Complete trace result
   */
  async traceAddress(address, options = {}) {
    const {
      maxHops = 4,
      startBlock = 0,
      endBlock = 99999999,
      includeZeroValue = false,
      stopAtCex = false, // Stop tracing a branch when CEX is hit
      maxTransactionsPerHop = 50 // NEW: Limit txs to trace per address
    } = options;

    console.log(`[TracingService] Starting trace for ${address}`);
    console.log(`[TracingService] Max hops: ${maxHops}, Stop at CEX: ${stopAtCex}`);

    // Initialize result
    const result = new TraceResult({
      originAddress: address.toLowerCase(),
      maxHops
    });

    try {
      // Start recursive tracing
      const visited = new Set(); // Prevent circular loops
      await this._traceRecursive(
        address,
        1, // Starting at hop 1
        maxHops,
        result,
        visited,
        null, // No parent trace
        { startBlock, endBlock, includeZeroValue, stopAtCex }
      );

      // Build transaction graph
      this.graphBuilder.clear();
      this.graphBuilder.buildFromTraces(result.traces);

      // Analyze patterns
      const patterns = this.pathAnalyzer.analyze(result.traces);
      result.patterns = patterns;
      result.patternSummary = this.pathAnalyzer.getSummary(patterns);

      // Find paths to CEX
      const pathsToCex = this.graphBuilder.findPathsToCex(address);
      result.pathsToCex = pathsToCex;

      // Mark as completed
      result.complete();

      console.log(`[TracingService] Trace completed: ${result.statistics.totalTransactions} transactions, ${result.statistics.cexDestinations} CEX hits`);

      return result;

    } catch (error) {
      console.error(`[TracingService] Trace failed: ${error.message}`);
      result.fail(error.message);
      return result;
    }
  }

  /**
   * Recursive tracing function
   */
  async _traceRecursive(
    address,
    currentHop,
    maxHops,
    result,
    visited,
    parentTraceId,
    options
  ) {
    // Check if we've exceeded max hops
    if (currentHop > maxHops) {
      console.log(`[TracingService] Max hops (${maxHops}) reached`);
      return;
    }

    // Check if we've already visited this address (prevent loops)
    const addressKey = `${address}_${currentHop}`;
    if (visited.has(addressKey)) {
      console.log(`[TracingService] Already visited ${address} at hop ${currentHop}, skipping`);
      return;
    }
    visited.add(addressKey);

    console.log(`[TracingService] Hop ${currentHop}: Tracing ${address}`);

    try {
      // Get all activity for this address
      const activity = await this.blockchainService.getAddressActivity(address, {
        startBlock: options.startBlock,
        endBlock: options.endBlock,
        includeZeroValue: options.includeZeroValue
      });

      console.log(`[TracingService] Hop ${currentHop}: Found ${activity.transactions.length} transactions`);

      // Filter for outgoing transactions only
      const outgoingTxs = activity.transactions.filter(
        tx => tx.from.toLowerCase() === address.toLowerCase() && tx.to
      );

      // Limit transactions per hop to prevent explosion
      const maxToProcess = options.maxTransactionsPerHop || 50;
      const txsToProcess = outgoingTxs.slice(0, maxToProcess);
      
      if (outgoingTxs.length > maxToProcess) {
        console.log(`[TracingService] Limiting to ${maxToProcess} of ${outgoingTxs.length} outgoing transactions`);
      }

      // Process each transaction
      for (const tx of txsToProcess) {

        // Classify the destination address
        const toClassification = await this.blockchainService.classifyAddress(tx.to);
        const fromClassification = activity.classification;

        // Create trace object
        const trace = Trace.fromTransaction(tx, currentHop, {
          parentTraceId,
          fromClassification,
          toClassification,
          isCexDestination: toClassification.isExchange,
          exchangeName: toClassification.exchangeInfo?.name || null
        });

        // Check if this is a terminal trace
        if (toClassification.isExchange) {
          trace.isTerminal = true;
          trace.terminationReason = `CEX destination: ${toClassification.exchangeInfo.exchange}`;
          
          // Record CEX detection
          result.addCexDetection({
            trace: trace.toJSON(),
            hopNumber: currentHop,
            exchange: toClassification.exchangeInfo.exchange,
            exchangeWallet: toClassification.exchangeInfo.name,
            txHash: tx.txHash,
            value: tx.value,
            token: tx.tokenSymbol,
            timestamp: tx.timestamp
          });

          console.log(`[TracingService] CEX HIT at hop ${currentHop}: ${toClassification.exchangeInfo.exchange}`);

          // Stop this branch if stopAtCex is true
          if (options.stopAtCex) {
            console.log(`[TracingService] Stopping branch due to CEX hit`);
            result.addTrace(trace);
            continue; // Don't recurse further
          }
        }

        // Add trace to result
        result.addTrace(trace);

        // Recurse to next hop (if not terminal or if we're not stopping at CEX)
        if (!trace.isTerminal || !options.stopAtCex) {
          await this._traceRecursive(
            tx.to,
            currentHop + 1,
            maxHops,
            result,
            visited,
            trace.id,
            options
          );
        }
      }

    } catch (error) {
      console.error(`[TracingService] Error at hop ${currentHop} for ${address}: ${error.message}`);
      result.addError(error);
    }
  }

  /**
   * Quick check: Does this address have any direct CEX transfers?
   * @param {string} address - Address to check
   * @returns {Promise<Object>} CEX detection result
   */
  async quickCexCheck(address) {
    console.log(`[TracingService] Quick CEX check for ${address}`);

    try {
      // Get current block for limited range
      const currentBlock = await this.blockchainService.getCurrentBlockNumber();
      const startBlock = currentBlock - 5000; // Only check last 5000 blocks
      
      console.log(`[TracingService] Checking blocks ${startBlock} to ${currentBlock}`);

      const activity = await this.blockchainService.getAddressActivity(address, {
        startBlock,
        endBlock: currentBlock,
        includeZeroValue: false
      });

      console.log(`[TracingService] Found ${activity.transactions.length} transactions to check`);

      const cexTransfers = [];
      let checked = 0;
      const maxToCheck = 100; // Limit classification calls

      for (const tx of activity.transactions) {
        // Skip if not from this address
        if (tx.from.toLowerCase() !== address.toLowerCase()) continue;
        
        // Skip if no destination (contract creation)
        if (!tx.to) continue;

        // Limit checks for performance
        if (checked >= maxToCheck) {
          console.log(`[TracingService] Reached limit of ${maxToCheck} checks, stopping`);
          break;
        }

        checked++;
        const toClassification = await this.blockchainService.classifyAddress(tx.to);

        if (toClassification.isExchange) {
          cexTransfers.push({
            txHash: tx.txHash,
            exchange: toClassification.exchangeInfo.exchange,
            exchangeWallet: toClassification.exchangeInfo.name,
            value: tx.value,
            token: tx.tokenSymbol,
            timestamp: tx.timestamp,
            blockNumber: tx.blockNumber
          });
        }
      }

      console.log(`[TracingService] Checked ${checked} transactions, found ${cexTransfers.length} CEX transfers`);

      return {
        address,
        hasCexTransfers: cexTransfers.length > 0,
        cexTransferCount: cexTransfers.length,
        transfers: cexTransfers,
        checkedCount: checked,
        totalTransactions: activity.transactions.length
      };

    } catch (error) {
      console.error(`[TracingService] Quick CEX check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get the transaction graph for visualization
   */
  getGraph() {
    return this.graphBuilder.exportForVisualization();
  }

  /**
   * Get pattern analysis
   */
  getPatterns() {
    return this.pathAnalyzer.toJSON();
  }
}

export default TracingService;