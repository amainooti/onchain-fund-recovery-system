/**
 * TraceResult - Aggregates all traces for a given address
 * 
 * Contains:
 * - All traced hops
 * - CEX detections
 * - Statistics
 * - Evidence summary
 */
export class TraceResult {
  constructor(data) {
    this.id = data.id || this._generateId();
    this.originAddress = data.originAddress;
    this.startedAt = data.startedAt || new Date().toISOString();
    this.completedAt = data.completedAt || null;
    this.status = data.status || 'in_progress'; // in_progress, completed, failed
    
    // Tracing parameters
    this.maxHops = data.maxHops || 4;
    this.actualHops = data.actualHops || 0;
    
    // All traces
    this.traces = data.traces || [];
    
    // CEX detections
    this.cexDetections = data.cexDetections || [];
    
    // Statistics
    this.statistics = data.statistics || this._initializeStatistics();
    
    // Errors encountered
    this.errors = data.errors || [];
  }

  /**
   * Generate unique result ID
   */
  _generateId() {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize statistics object
   */
  _initializeStatistics() {
    return {
      totalTransactions: 0,
      totalHops: 0,
      cexDestinations: 0,
      uniqueAddresses: 0,
      totalValueTraced: {
        eth: '0',
        tokens: []
      },
      transactionTypes: {
        native: 0,
        erc20: 0,
        internal: 0
      }
    };
  }

  /**
   * Add a trace to the result
   */
  addTrace(trace) {
    this.traces.push(trace);
    this._updateStatistics(trace);
  }

  /**
   * Add a CEX detection
   */
  addCexDetection(detection) {
    this.cexDetections.push({
      ...detection,
      detectedAt: new Date().toISOString()
    });
    this.statistics.cexDestinations++;
  }

  /**
   * Add an error
   */
  addError(error) {
    this.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Mark trace as completed
   */
  complete() {
    this.status = 'completed';
    this.completedAt = new Date().toISOString();
    this.actualHops = Math.max(...this.traces.map(t => t.hopNumber), 0);
  }

  /**
   * Mark trace as failed
   */
  fail(reason) {
    this.status = 'failed';
    this.completedAt = new Date().toISOString();
    this.addError(new Error(reason));
  }

  /**
   * Update statistics based on new trace
   */
  _updateStatistics(trace) {
    this.statistics.totalTransactions++;
    this.statistics.transactionTypes[trace.type]++;
    
    // Track unique addresses
    const addresses = new Set(this.traces.flatMap(t => [t.from, t.to]));
    this.statistics.uniqueAddresses = addresses.size;
    
    // Update total value traced
    if (trace.type === 'native' || trace.type === 'internal') {
      const currentEth = parseFloat(this.statistics.totalValueTraced.eth) || 0;
      const newEth = parseFloat(trace.value) || 0;
      this.statistics.totalValueTraced.eth = (currentEth + newEth).toString();
    } else if (trace.type === 'erc20') {
      const existingToken = this.statistics.totalValueTraced.tokens.find(
        t => t.address === trace.token
      );
      
      if (existingToken) {
        existingToken.amount = (
          parseFloat(existingToken.amount) + parseFloat(trace.value)
        ).toString();
      } else {
        this.statistics.totalValueTraced.tokens.push({
          address: trace.token,
          symbol: trace.tokenSymbol,
          amount: trace.value
        });
      }
    }
  }

  /**
   * Get traces by hop number
   */
  getTracesByHop(hopNumber) {
    return this.traces.filter(t => t.hopNumber === hopNumber);
  }

  /**
   * Get all terminal traces (can't continue)
   */
  getTerminalTraces() {
    return this.traces.filter(t => t.isTerminal);
  }

  /**
   * Get all CEX destination traces
   */
  getCexTraces() {
    return this.traces.filter(t => t.isCexDestination);
  }

  /**
   * Get summary
   */
  getSummary() {
    return {
      originAddress: this.originAddress,
      status: this.status,
      duration: this.completedAt 
        ? new Date(this.completedAt) - new Date(this.startedAt)
        : null,
      hops: `${this.actualHops}/${this.maxHops}`,
      transactions: this.statistics.totalTransactions,
      cexDetections: this.statistics.cexDestinations,
      uniqueAddresses: this.statistics.uniqueAddresses,
      hasErrors: this.errors.length > 0
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      originAddress: this.originAddress,
      timing: {
        startedAt: this.startedAt,
        completedAt: this.completedAt,
        status: this.status
      },
      parameters: {
        maxHops: this.maxHops,
        actualHops: this.actualHops
      },
      traces: this.traces.map(t => t.toJSON()),
      cexDetections: this.cexDetections,
      statistics: this.statistics,
      errors: this.errors,
      summary: this.getSummary()
    };
  }
}

export default TraceResult;