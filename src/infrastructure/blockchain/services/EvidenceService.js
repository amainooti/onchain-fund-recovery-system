/**
 * EvidenceService - Formats trace results for legal/administrative use
 * 
 * Generates:
 * - Timestamped evidence reports
 * - Transaction summaries
 * - CEX identification reports
 * - Formatted data for PDF generation
 */
export class EvidenceService {
  constructor() {
    // Evidence formatting templates
  }

  /**
   * Generate comprehensive evidence report
   * @param {TraceResult} traceResult - Complete trace result
   * @returns {Object} Formatted evidence report
   */
  generateEvidenceReport(traceResult) {
    const report = {
      reportId: this._generateReportId(),
      generatedAt: new Date().toISOString(),
      
      // Case information
      caseInfo: {
        originAddress: traceResult.originAddress,
        traceId: traceResult.id,
        tracingPeriod: {
          started: traceResult.startedAt,
          completed: traceResult.completedAt
        },
        status: traceResult.status
      },

      // Executive summary
      executiveSummary: this._generateExecutiveSummary(traceResult),

      // CEX findings (most important for recovery)
      cexFindings: this._formatCexFindings(traceResult),

      // Transaction trail
      transactionTrail: this._formatTransactionTrail(traceResult),

      // Pattern analysis
      patternAnalysis: traceResult.patternSummary || null,

      // Statistics
      statistics: traceResult.statistics,

      // Recommendations
      recommendations: this._generateRecommendations(traceResult)
    };

    return report;
  }

  /**
   * Generate executive summary
   */
  _generateExecutiveSummary(traceResult) {
    const hasCexHits = traceResult.statistics.cexDestinations > 0;
    
    return {
      overview: `Traced ${traceResult.statistics.totalTransactions} transactions across ${traceResult.actualHops} hops from origin address ${traceResult.originAddress}`,
      
      keyFindings: [
        `${traceResult.statistics.cexDestinations} exchange destination(s) detected`,
        `${traceResult.statistics.uniqueAddresses} unique addresses involved`,
        `Total value traced: ${traceResult.statistics.totalValueTraced.eth} ETH${
          traceResult.statistics.totalValueTraced.tokens.length > 0 
            ? ` + ${traceResult.statistics.totalValueTraced.tokens.length} token types`
            : ''
        }`
      ],

      recoveryProspect: hasCexHits 
        ? 'GOOD - Funds reached identified exchanges. Contact exchange support with this evidence.'
        : 'LIMITED - No exchange destinations detected. Funds may be in private wallets.',

      urgency: hasCexHits ? 'HIGH - Act quickly before funds are moved off-exchange' : 'MEDIUM'
    };
  }

  /**
   * Format CEX findings for evidence
   */
  _formatCexFindings(traceResult) {
    if (traceResult.cexDetections.length === 0) {
      return {
        found: false,
        message: 'No exchange destinations detected in traced transactions'
      };
    }

    // Group by exchange
    const byExchange = {};
    traceResult.cexDetections.forEach(detection => {
      const exchange = detection.exchange;
      if (!byExchange[exchange]) {
        byExchange[exchange] = {
          exchangeName: exchange,
          wallets: new Set(),
          transactions: [],
          totalValue: { eth: 0, tokens: [] }
        };
      }

      byExchange[exchange].wallets.add(detection.exchangeWallet);
      byExchange[exchange].transactions.push({
        txHash: detection.txHash,
        hopNumber: detection.hopNumber,
        value: detection.value,
        token: detection.token,
        timestamp: detection.timestamp,
        timestampHuman: new Date(detection.timestamp * 1000).toISOString(),
        explorerUrl: `https://etherscan.io/tx/${detection.txHash}`
      });

      // Aggregate value
      if (detection.token === 'ETH') {
        byExchange[exchange].totalValue.eth += parseFloat(detection.value);
      } else {
        const existing = byExchange[exchange].totalValue.tokens.find(
          t => t.symbol === detection.token
        );
        if (existing) {
          existing.amount += parseFloat(detection.value);
        } else {
          byExchange[exchange].totalValue.tokens.push({
            symbol: detection.token,
            amount: parseFloat(detection.value)
          });
        }
      }
    });

    // Convert to array and format
    const findings = Object.values(byExchange).map(exchange => ({
      exchangeName: exchange.exchangeName,
      walletCount: exchange.wallets.size,
      wallets: Array.from(exchange.wallets),
      transactionCount: exchange.transactions.length,
      transactions: exchange.transactions,
      totalValue: {
        eth: exchange.totalValue.eth.toFixed(6),
        tokens: exchange.totalValue.tokens.map(t => ({
          symbol: t.symbol,
          amount: t.amount.toFixed(6)
        }))
      },
      contactInfo: this._getExchangeContactInfo(exchange.exchangeName)
    }));

    return {
      found: true,
      count: findings.length,
      exchanges: findings
    };
  }

  /**
   * Format transaction trail
   */
  _formatTransactionTrail(traceResult) {
    return traceResult.traces.map(trace => ({
      hopNumber: trace.hopNumber,
      txHash: trace.txHash,
      from: trace.from,
      to: trace.to,
      value: trace.value,
      token: trace.tokenSymbol,
      type: trace.type,
      timestamp: new Date(trace.timestamp * 1000).toISOString(),
      blockNumber: trace.blockNumber,
      explorerUrl: `https://etherscan.io/tx/${trace.txHash}`,
      
      // Classification
      fromType: trace.fromClassification?.isContract ? 'Contract' :
                trace.fromClassification?.isEOA ? 'EOA' : 'Unknown',
      toType: trace.toClassification?.isContract ? 'Contract' :
              trace.toClassification?.isEOA ? 'EOA' : 'Unknown',
      
      // Special flags
      isCexDestination: trace.isCexDestination,
      exchangeName: trace.exchangeName,
      isTerminal: trace.isTerminal
    }));
  }

  /**
   * Generate recommendations based on findings
   */
  _generateRecommendations(traceResult) {
    const recommendations = [];

    // If CEX hits found
    if (traceResult.statistics.cexDestinations > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Contact Exchange Support',
        details: 'Submit a support ticket to each exchange with transaction hashes and this evidence report. Request account freeze if theft/fraud occurred.',
        exchanges: traceResult.cexDetections.map(d => d.exchange)
      });

      recommendations.push({
        priority: 'HIGH',
        action: 'File Police Report',
        details: 'If theft occurred, file a police report immediately. Many exchanges require this for fund recovery.'
      });

      recommendations.push({
        priority: 'MEDIUM',
        action: 'Legal Consultation',
        details: 'Consult with a crypto-specialized lawyer about subpoena options if exchange cooperation is insufficient.'
      });
    } else {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Continue Monitoring',
        details: 'Funds are still in private wallets. Monitor these addresses for future CEX deposits.',
        addresses: [...new Set(traceResult.traces.map(t => t.to))]
      });

      recommendations.push({
        priority: 'LOW',
        action: 'Blockchain Analysis Firms',
        details: 'Consider hiring a professional blockchain analysis firm (Chainalysis, Elliptic, CipherTrace) for deeper investigation.'
      });
    }

    // Pattern-based recommendations
    if (traceResult.patternSummary?.riskLevel === 'high' || 
        traceResult.patternSummary?.riskLevel === 'critical') {
      recommendations.push({
        priority: 'HIGH',
        action: 'Law Enforcement Notification',
        details: 'Complex laundering patterns detected. Notify law enforcement cybercrime units immediately.'
      });
    }

    return recommendations;
  }

  /**
   * Get exchange contact information
   */
  _getExchangeContactInfo(exchangeName) {
    const contacts = {
      'Binance': {
        support: 'https://www.binance.com/en/support',
        lawEnforcement: 'lawenforcement@binance.com'
      },
      'Coinbase': {
        support: 'https://help.coinbase.com/',
        lawEnforcement: 'https://www.coinbase.com/legal/law-enforcement'
      },
      'Kraken': {
        support: 'https://support.kraken.com/',
        lawEnforcement: 'lawenforcement@kraken.com'
      }
    };

    return contacts[exchangeName] || {
      support: 'Check exchange website',
      lawEnforcement: 'Contact via exchange support'
    };
  }

  /**
   * Generate report ID
   */
  _generateReportId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Format for PDF generation (simplified structure)
   */
  formatForPdf(traceResult) {
    const report = this.generateEvidenceReport(traceResult);

    return {
      title: 'Blockchain Fund Tracing Report',
      reportId: report.reportId,
      generatedAt: report.generatedAt,
      
      sections: [
        {
          title: 'Case Information',
          content: report.caseInfo
        },
        {
          title: 'Executive Summary',
          content: report.executiveSummary
        },
        {
          title: 'Exchange Findings',
          content: report.cexFindings,
          highlight: true // Important section
        },
        {
          title: 'Transaction Trail',
          content: report.transactionTrail
        },
        {
          title: 'Recommendations',
          content: report.recommendations
        }
      ]
    };
  }
}

export default EvidenceService;