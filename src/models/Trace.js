/**
 * Trace - Represents a single hop in the fund flow
 * 
 * Contains information about:
 * - Transaction details
 * - Address classification
 * - Hop depth
 * - CEX detection status
 */
export class Trace {
  constructor(data) {
    this.id = data.id || this._generateId();
    this.hopNumber = data.hopNumber;
    this.parentTraceId = data.parentTraceId || null;
    
    // Transaction data
    this.txHash = data.txHash;
    this.from = data.from;
    this.to = data.to;
    this.value = data.value;
    this.valueWei = data.valueWei;
    this.token = data.token;
    this.tokenSymbol = data.tokenSymbol;
    this.type = data.type;
    this.blockNumber = data.blockNumber;
    this.timestamp = data.timestamp;
    
    // Classification data
    this.fromClassification = data.fromClassification || null;
    this.toClassification = data.toClassification || null;
    
    // Analysis flags
    this.isCexDestination = data.isCexDestination || false;
    this.exchangeName = data.exchangeName || null;
    this.isTerminal = data.isTerminal || false; // Can't trace further
    this.terminationReason = data.terminationReason || null;
    
    // Metadata
    this.tracedAt = data.tracedAt || new Date().toISOString();
  }

  /**
   * Generate unique trace ID
   */
  _generateId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if this trace hit a CEX
   */
  hitsCex() {
    return this.isCexDestination;
  }

  /**
   * Check if this trace is terminal (can't continue)
   */
  isTerminalTrace() {
    return this.isTerminal;
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      id: this.id,
      hopNumber: this.hopNumber,
      parentTraceId: this.parentTraceId,
      transaction: {
        txHash: this.txHash,
        from: this.from,
        to: this.to,
        value: this.value,
        valueWei: this.valueWei,
        token: this.token,
        tokenSymbol: this.tokenSymbol,
        type: this.type,
        blockNumber: this.blockNumber,
        timestamp: this.timestamp
      },
      classification: {
        from: this.fromClassification,
        to: this.toClassification
      },
      analysis: {
        isCexDestination: this.isCexDestination,
        exchangeName: this.exchangeName,
        isTerminal: this.isTerminal,
        terminationReason: this.terminationReason
      },
      tracedAt: this.tracedAt
    };
  }

  /**
   * Create Trace from normalized transaction
   */
  static fromTransaction(tx, hopNumber, options = {}) {
    return new Trace({
      hopNumber,
      txHash: tx.txHash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      valueWei: tx.valueWei,
      token: tx.token,
      tokenSymbol: tx.tokenSymbol,
      type: tx.type,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      ...options
    });
  }
}

export default Trace;