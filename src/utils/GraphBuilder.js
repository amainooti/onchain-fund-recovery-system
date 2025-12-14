/**
 * GraphBuilder - Constructs a transaction flow graph
 * 
 * Builds a directed graph where:
 * - Nodes = addresses
 * - Edges = transactions
 * 
 * Useful for visualization and path analysis
 */
export class GraphBuilder {
  constructor() {
    this.nodes = new Map(); // address -> node data
    this.edges = []; // transaction edges
  }

  /**
   * Add a node (address) to the graph
   */
  addNode(address, classification = null) {
    if (!this.nodes.has(address)) {
      this.nodes.set(address, {
        address,
        classification,
        inDegree: 0,
        outDegree: 0,
        totalValueIn: 0,
        totalValueOut: 0,
        transactions: []
      });
    }
    return this.nodes.get(address);
  }

  /**
   * Add an edge (transaction) to the graph
   */
  addEdge(trace) {
    const fromNode = this.addNode(trace.from, trace.fromClassification);
    const toNode = this.addNode(trace.to, trace.toClassification);

    const edge = {
      from: trace.from,
      to: trace.to,
      txHash: trace.txHash,
      value: trace.value,
      valueWei: trace.valueWei,
      token: trace.token,
      tokenSymbol: trace.tokenSymbol,
      type: trace.type,
      hopNumber: trace.hopNumber,
      timestamp: trace.timestamp,
      blockNumber: trace.blockNumber
    };

    this.edges.push(edge);

    // Update node statistics
    fromNode.outDegree++;
    toNode.inDegree++;
    fromNode.transactions.push(edge);
    toNode.transactions.push(edge);

    const value = parseFloat(trace.value) || 0;
    fromNode.totalValueOut += value;
    toNode.totalValueIn += value;
  }

  /**
   * Build graph from traces
   */
  buildFromTraces(traces) {
    traces.forEach(trace => this.addEdge(trace));
  }

  /**
   * Get all outgoing transactions from an address
   */
  getOutgoingTransactions(address) {
    const node = this.nodes.get(address.toLowerCase());
    if (!node) return [];
    
    return this.edges.filter(e => e.from === address.toLowerCase());
  }

  /**
   * Get all incoming transactions to an address
   */
  getIncomingTransactions(address) {
    const node = this.nodes.get(address.toLowerCase());
    if (!node) return [];
    
    return this.edges.filter(e => e.to === address.toLowerCase());
  }

  /**
   * Find all paths from origin to CEX
   */
  findPathsToCex(originAddress) {
    const paths = [];
    const visited = new Set();

    const dfs = (currentAddress, path) => {
      if (visited.has(currentAddress)) return;
      visited.add(currentAddress);

      const node = this.nodes.get(currentAddress);
      if (!node) return;

      // Check if this is a CEX
      if (node.classification?.isExchange) {
        paths.push([...path, currentAddress]);
        visited.delete(currentAddress);
        return;
      }

      // Get outgoing transactions
      const outgoing = this.getOutgoingTransactions(currentAddress);
      
      if (outgoing.length === 0) {
        // Dead end - no more transactions
        visited.delete(currentAddress);
        return;
      }

      // Explore each outgoing transaction
      for (const tx of outgoing) {
        dfs(tx.to, [...path, currentAddress]);
      }

      visited.delete(currentAddress);
    };

    dfs(originAddress.toLowerCase(), []);
    return paths;
  }

  /**
   * Get graph statistics
   */
  getStatistics() {
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      cexNodes: Array.from(this.nodes.values()).filter(
        n => n.classification?.isExchange
      ).length,
      contractNodes: Array.from(this.nodes.values()).filter(
        n => n.classification?.isContract
      ).length,
      eoaNodes: Array.from(this.nodes.values()).filter(
        n => n.classification?.isEOA
      ).length
    };
  }

  /**
   * Export graph for visualization (D3, Cytoscape, etc.)
   */
  exportForVisualization() {
    return {
      nodes: Array.from(this.nodes.values()).map(node => ({
        id: node.address,
        label: node.classification?.exchangeInfo?.name || 
               node.address.slice(0, 8) + '...',
        type: node.classification?.isExchange ? 'cex' :
              node.classification?.isContract ? 'contract' : 'eoa',
        inDegree: node.inDegree,
        outDegree: node.outDegree,
        totalValueIn: node.totalValueIn,
        totalValueOut: node.totalValueOut
      })),
      edges: this.edges.map((edge, idx) => ({
        id: `edge_${idx}`,
        source: edge.from,
        target: edge.to,
        label: `${edge.value} ${edge.tokenSymbol}`,
        value: parseFloat(edge.value),
        txHash: edge.txHash,
        type: edge.type,
        hopNumber: edge.hopNumber
      }))
    };
  }

  /**
   * Clear the graph
   */
  clear() {
    this.nodes.clear();
    this.edges = [];
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      nodes: Array.from(this.nodes.entries()).map(([address, data]) => ({
        address,
        ...data
      })),
      edges: this.edges,
      statistics: this.getStatistics()
    };
  }
}

export default GraphBuilder;