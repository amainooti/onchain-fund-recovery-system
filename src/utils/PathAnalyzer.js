/**
 * PathAnalyzer - Analyzes transaction paths for patterns
 * 
 * Detects:
 * - Direct CEX deposits
 * - Multi-hop obfuscation attempts
 * - Common laundering patterns
 * - Fund splitting/consolidation
 */
export class PathAnalyzer {
  constructor() {
    this.patterns = {
      directCex: [],
      multiHopCex: [],
      splitting: [],
      consolidation: [],
      circular: []
    };
  }

  /**
   * Analyze all traces and detect patterns
   */
  analyze(traces) {
    this.patterns = {
      directCex: [],
      multiHopCex: [],
      splitting: [],
      consolidation: [],
      circular: []
    };

    this._detectDirectCex(traces);
    this._detectMultiHopCex(traces);
    this._detectSplitting(traces);
    this._detectConsolidation(traces);
    this._detectCircular(traces);

    return this.patterns;
  }

  /**
   * Detect direct transfers to CEX (1 hop)
   */
  _detectDirectCex(traces) {
    this.patterns.directCex = traces.filter(trace => 
      trace.hopNumber === 1 && trace.isCexDestination
    ).map(trace => ({
      txHash: trace.txHash,
      exchange: trace.exchangeName,
      value: trace.value,
      token: trace.tokenSymbol,
      timestamp: trace.timestamp,
      severity: 'high', // Easier to track
      description: `Direct transfer to ${trace.exchangeName}`
    }));
  }

  /**
   * Detect multi-hop transfers to CEX (2+ hops)
   */
  _detectMultiHopCex(traces) {
    this.patterns.multiHopCex = traces.filter(trace => 
      trace.hopNumber > 1 && trace.isCexDestination
    ).map(trace => ({
      txHash: trace.txHash,
      exchange: trace.exchangeName,
      hops: trace.hopNumber,
      value: trace.value,
      token: trace.tokenSymbol,
      timestamp: trace.timestamp,
      severity: 'medium', // Slightly obfuscated
      description: `${trace.hopNumber}-hop transfer to ${trace.exchangeName}`
    }));
  }

  /**
   * Detect fund splitting (1 address -> multiple addresses)
   */
  _detectSplitting(traces) {
    const fromAddresses = new Map();
    
    traces.forEach(trace => {
      if (!fromAddresses.has(trace.from)) {
        fromAddresses.set(trace.from, []);
      }
      fromAddresses.get(trace.from).push(trace);
    });

    // Find addresses that sent to multiple destinations
    fromAddresses.forEach((txs, fromAddress) => {
      if (txs.length > 2) { // Sent to 3+ addresses
        const uniqueDestinations = new Set(txs.map(t => t.to));
        
        if (uniqueDestinations.size > 2) {
          this.patterns.splitting.push({
            address: fromAddress,
            destinationCount: uniqueDestinations.size,
            totalValue: txs.reduce((sum, t) => sum + parseFloat(t.value || 0), 0),
            transactions: txs.map(t => t.txHash),
            severity: 'medium',
            description: `Funds split from ${fromAddress.slice(0, 10)}... to ${uniqueDestinations.size} addresses`
          });
        }
      }
    });
  }

  /**
   * Detect fund consolidation (multiple addresses -> 1 address)
   */
  _detectConsolidation(traces) {
    const toAddresses = new Map();
    
    traces.forEach(trace => {
      if (!toAddresses.has(trace.to)) {
        toAddresses.set(trace.to, []);
      }
      toAddresses.get(trace.to).push(trace);
    });

    // Find addresses that received from multiple sources
    toAddresses.forEach((txs, toAddress) => {
      if (txs.length > 2) { // Received from 3+ addresses
        const uniqueSources = new Set(txs.map(t => t.from));
        
        if (uniqueSources.size > 2) {
          this.patterns.consolidation.push({
            address: toAddress,
            sourceCount: uniqueSources.size,
            totalValue: txs.reduce((sum, t) => sum + parseFloat(t.value || 0), 0),
            transactions: txs.map(t => t.txHash),
            severity: 'medium',
            description: `Funds consolidated to ${toAddress.slice(0, 10)}... from ${uniqueSources.size} addresses`
          });
        }
      }
    });
  }

  /**
   * Detect circular flows (funds return to origin)
   */
  _detectCircular(traces) {
    const addressFlow = new Map();
    
    traces.forEach(trace => {
      if (!addressFlow.has(trace.from)) {
        addressFlow.set(trace.from, { sent: [], received: [] });
      }
      if (!addressFlow.has(trace.to)) {
        addressFlow.set(trace.to, { sent: [], received: [] });
      }
      
      addressFlow.get(trace.from).sent.push(trace.to);
      addressFlow.get(trace.to).received.push(trace.from);
    });

    // Check for circular patterns
    addressFlow.forEach((flow, address) => {
      const sentTo = new Set(flow.sent);
      const receivedFrom = new Set(flow.received);
      
      // Find addresses that both sent to and received from this address
      const circular = [...sentTo].filter(addr => receivedFrom.has(addr));
      
      if (circular.length > 0) {
        this.patterns.circular.push({
          address,
          circularAddresses: circular,
          severity: 'high',
          description: `Circular flow detected involving ${address.slice(0, 10)}...`
        });
      }
    });
  }

  /**
   * Get risk score based on patterns
   */
  getRiskScore(patterns) {
    let score = 0;
    
    // Direct CEX = lower risk (easier to track)
    score += patterns.directCex.length * 10;
    
    // Multi-hop CEX = moderate risk
    score += patterns.multiHopCex.length * 25;
    
    // Splitting = high risk (obfuscation attempt)
    score += patterns.splitting.length * 40;
    
    // Consolidation = moderate risk
    score += patterns.consolidation.length * 30;
    
    // Circular = very high risk (laundering indicator)
    score += patterns.circular.length * 50;
    
    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Generate human-readable summary
   */
  getSummary(patterns) {
    const total = Object.values(patterns).reduce((sum, arr) => sum + arr.length, 0);
    
    if (total === 0) {
      return {
        message: 'No suspicious patterns detected',
        riskLevel: 'low',
        score: 0
      };
    }

    const score = this.getRiskScore(patterns);
    let riskLevel = 'low';
    
    if (score > 70) riskLevel = 'critical';
    else if (score > 50) riskLevel = 'high';
    else if (score > 30) riskLevel = 'medium';

    return {
      message: `Detected ${total} suspicious patterns`,
      riskLevel,
      score,
      patterns: {
        directCex: patterns.directCex.length,
        multiHopCex: patterns.multiHopCex.length,
        splitting: patterns.splitting.length,
        consolidation: patterns.consolidation.length,
        circular: patterns.circular.length
      }
    };
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      patterns: this.patterns,
      summary: this.getSummary(this.patterns)
    };
  }
}

export default PathAnalyzer;