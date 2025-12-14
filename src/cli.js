import dotenv from 'dotenv';
import { BlockchainService } from './infrastructure/blockchain/services/BlockchainService.js';
import { TracingService } from './infrastructure/blockchain/services/TracingService.js';
import { EvidenceService } from './infrastructure/blockchain/services/EvidenceService.js';
import { writeFileSync } from 'fs';
import { validateAddress } from './utils/validation.js';


dotenv.config();

/**
 * Crypto Recovery Platform - Unified Demo
 * 
 * Demonstrates all system capabilities:
 * Phase 1: Blockchain Connectivity Layer
 * Phase 2: Tracing Engine
 */

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'help';

  console.log('='.repeat(70));
  console.log('Crypto Recovery Platform');
  console.log('='.repeat(70));
  console.log('');

  switch (mode) {
    case 'blockchain':
      await demoBlockchainLayer();
      break;
    case 'trace':
      await demoTracingEngine();
      break;
    case 'quick-check':
      const address = args[1];
      if (!address) {
        console.error('❌ Error: Address required');
        console.log('Usage: npm start quick-check <address>');
        process.exit(1);
      }
      await quickCexCheck(address);
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

/**
 * Show help menu
 */
function showHelp() {
  console.log('Available commands:');
  console.log('');
  console.log('  npm start blockchain          Demo blockchain connectivity layer');
  console.log('  npm start trace               Demo multi-hop fund tracing');
  console.log('  npm start quick-check <addr>  Quick CEX check for address');
  console.log('  npm run check <addr>          Check if address is suitable for tracing');
  console.log('  npm start help                Show this help');
  console.log('');
  console.log('Examples:');
  console.log('  npm start blockchain');
  console.log('  npm start trace');
  console.log('  npm start quick-check 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
  console.log('  npm run check 0x28C6c06298d514Db089934071355E5743bf21d60');
  console.log('');
  console.log('Tips:');
  console.log('  - Use "npm run check" BEFORE tracing to verify address suitability');
  console.log('  - Contracts (like token contracts) cannot be traced - use EOA wallets');
  console.log('  - Change test address in src/cli.js for custom traces');
  console.log('');
}

/**
 * Demo: Blockchain Connectivity Layer (Phase 1)
 */
async function demoBlockchainLayer() {
  console.log('📡 BLOCKCHAIN CONNECTIVITY LAYER DEMO');
  console.log('='.repeat(70));
  console.log('');

  const blockchainService = new BlockchainService();
  const testAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

  try {
    // 1. Current block
    console.log('[1] Getting current block number...');
    
    let currentBlock;
    try {
      currentBlock = await blockchainService.getCurrentBlockNumber();
      console.log(`Current block: ${currentBlock}`);
    } catch (error) {
      console.log(`⚠️  RPC connection slow/failed: ${error.message}`);
      console.log('Trying Etherscan instead...');
      // Use a known recent block as fallback
      currentBlock = 23995000;
      console.log(`Using approximate block: ${currentBlock}`);
    }
    console.log('');

    // 2. Classify address
    console.log('[2] Classifying address...');
    const classification = await blockchainService.classifyAddress(testAddress);
    console.log('Classification:', JSON.stringify(classification, null, 2));
    console.log('');

    // 3. Get activity
    console.log('[3] Fetching address activity (last 1000 blocks)...');
    const startBlock = currentBlock - 1000;
    const activity = await blockchainService.getAddressActivity(testAddress, {
      startBlock,
      endBlock: currentBlock,
      includeZeroValue: false
    });

    console.log(`Found ${activity.transactionCount} transactions`);
    console.log('');

    // Show first 3
    if (activity.transactions.length > 0) {
      console.log('First 3 transactions:');
      activity.transactions.slice(0, 3).forEach((tx, idx) => {
        console.log(`\nTransaction ${idx + 1}:`);
        console.log(`  Hash: ${tx.txHash}`);
        console.log(`  Type: ${tx.type}`);
        console.log(`  From: ${tx.from}`);
        console.log(`  To: ${tx.to}`);
        console.log(`  Value: ${tx.value} ${tx.tokenSymbol || 'ETH'}`);
        console.log(`  Block: ${tx.blockNumber}`);
      });
    }
    console.log('');

    // 4. CEX detection
    console.log('[4] Testing CEX detection...');
    const binanceWallet = '0x28c6c06298d514db089934071355e5743bf21d60';
    const cexClassification = await blockchainService.classifyAddress(binanceWallet);
    console.log('Binance wallet:', JSON.stringify(cexClassification, null, 2));
    console.log('');

    console.log('✅ Blockchain layer demo completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('💡 Tip: Check your internet connection and RPC endpoints');
    console.log('   The trace and quick-check commands work better for slow connections.');
    process.exit(1);
  }
}

/**
 * Demo: Tracing Engine (Phase 2)
 */
async function demoTracingEngine() {
  console.log('🔍 TRACING ENGINE DEMO');
  console.log('='.repeat(70));
  console.log('');

  const tracingService = new TracingService();
  const evidenceService = new EvidenceService();
  
  // Use a moderately active wallet for demo
  // This wallet has regular outgoing transactions (not a contract)
  // You can replace this with ANY address you want to trace
  const testAddress = '0x28C6c06298d514Db089934071355E5743bf21d60'; // Binance 14
  
  // Validate the test address
  const validation = validateAddress(testAddress);
  if (!validation.valid) {
    console.error(`❌ Invalid demo address: ${validation.error}`);
    console.log('Please update the address in cli.js');
    process.exit(1);
  }
  
  const checksummedAddress = validation.checksummed;
  
  console.log(`🎯 Target Address: ${checksummedAddress}`);
  console.log('💡 Tip: Replace this address in src/cli.js to trace your target wallet');
  console.log('');
  console.log('📌 Note: Current demo address is Binance hot wallet (for testing)');
  console.log('   Replace with victim/scammer address for real investigation');
  console.log('');

  try {
    // 1. Quick CEX check
    console.log('📋 [STEP 1] Quick CEX Check');
    console.log('-'.repeat(70));
    const quickCheck = await tracingService.quickCexCheck(checksummedAddress);
    console.log(`Checked: ${quickCheck.checkedCount} of ${quickCheck.totalTransactions} transactions`);
    console.log(`Has direct CEX transfers: ${quickCheck.hasCexTransfers}`);
    console.log(`CEX transfer count: ${quickCheck.cexTransferCount}`);
    
    if (quickCheck.hasCexTransfers) {
      console.log('Direct CEX transfers:');
      quickCheck.transfers.forEach((transfer, idx) => {
        console.log(`  ${idx + 1}. ${transfer.exchange} - ${transfer.value} ${transfer.token}`);
        console.log(`     TX: ${transfer.txHash}`);
      });
    }
    console.log('');

    // 2. Full trace
    console.log('🔍 [STEP 2] Full Multi-Hop Trace');
    console.log('-'.repeat(70));
    
    const currentBlock = await tracingService.blockchainService.getCurrentBlockNumber();
    const startBlock = currentBlock - 5000; // Last 5000 blocks for reasonable speed
    
    console.log(`Tracing from block ${startBlock} to ${currentBlock}...`);
    console.log('(Using limited block range for demo speed)');
    console.log('');

    const traceResult = await tracingService.traceAddress(checksummedAddress, {
      maxHops: 2, // Reduced for demo
      startBlock,
      endBlock: currentBlock,
      includeZeroValue: false,
      stopAtCex: true,
      maxTransactionsPerHop: 20 // Limit to 20 txs per address to avoid explosion
    });

    console.log('✅ Tracing Complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`  Status: ${traceResult.status}`);
    console.log(`  Total Transactions: ${traceResult.statistics.totalTransactions}`);
    console.log(`  Hops Traced: ${traceResult.actualHops}/${traceResult.maxHops}`);
    console.log(`  Unique Addresses: ${traceResult.statistics.uniqueAddresses}`);
    console.log(`  CEX Destinations: ${traceResult.statistics.cexDestinations}`);
    console.log('');

    // CEX detections
    if (traceResult.cexDetections.length > 0) {
      console.log('🏦 CEX Detections:');
      traceResult.cexDetections.forEach((detection, idx) => {
        console.log(`  ${idx + 1}. ${detection.exchange} (Hop ${detection.hopNumber})`);
        console.log(`     Amount: ${detection.value} ${detection.token}`);
        console.log(`     TX: ${detection.txHash}`);
        console.log('');
      });
    } else {
      console.log('❌ No CEX destinations found');
      console.log('');
    }

    // Pattern analysis
    if (traceResult.patternSummary) {
      console.log('🔎 Pattern Analysis:');
      console.log(`  Risk Level: ${traceResult.patternSummary.riskLevel.toUpperCase()}`);
      console.log(`  Risk Score: ${traceResult.patternSummary.score}/100`);
      console.log('');
    }

    // 3. Evidence report
    console.log('📄 [STEP 3] Generating Evidence Report');
    console.log('-'.repeat(70));
    
    const evidenceReport = evidenceService.generateEvidenceReport(traceResult);
    
    console.log(`Report ID: ${evidenceReport.reportId}`);
    console.log('');
    console.log('Executive Summary:');
    console.log(`  ${evidenceReport.executiveSummary.overview}`);
    console.log('');
    console.log(`Recovery Prospect: ${evidenceReport.executiveSummary.recoveryProspect}`);
    console.log(`Urgency: ${evidenceReport.executiveSummary.urgency}`);
    console.log('');

    // Recommendations
    if (evidenceReport.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      evidenceReport.recommendations.forEach((rec, idx) => {
        console.log(`  ${idx + 1}. [${rec.priority}] ${rec.action}`);
      });
      console.log('');
    }

    // Save files
    const reportPath = `./trace-report-${evidenceReport.reportId}.json`;
    writeFileSync(reportPath, JSON.stringify(evidenceReport, null, 2));
    console.log(`📁 Report saved: ${reportPath}`);

    const tracePath = `./trace-result-${traceResult.id}.json`;
    writeFileSync(tracePath, JSON.stringify(traceResult.toJSON(), null, 2));
    console.log(`📁 Trace saved: ${tracePath}`);

    const graphData = tracingService.getGraph();
    const graphPath = `./trace-graph-${traceResult.id}.json`;
    writeFileSync(graphPath, JSON.stringify(graphData, null, 2));
    console.log(`📁 Graph saved: ${graphPath}`);
    console.log('');

    console.log('✅ Tracing engine demo completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Quick CEX check utility
 */
async function quickCexCheck(address) {
  console.log('⚡ QUICK CEX CHECK');
  console.log('='.repeat(70));
  console.log(`Address: ${address}`);
  console.log('');

  // Validate address first
  const validation = validateAddress(address);
  if (!validation.valid) {
    console.error(`❌ Invalid address: ${validation.error}`);
    console.log('');
    console.log('Example valid address: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984');
    process.exit(1);
  }

  // Use checksummed version
  const checksummedAddress = validation.checksummed;
  console.log(`✅ Valid address (checksummed): ${checksummedAddress}`);
  console.log('');

  const tracingService = new TracingService();

  try {
    const result = await tracingService.quickCexCheck(checksummedAddress);

    console.log(`Checked: ${result.checkedCount} of ${result.totalTransactions} transactions`);
    console.log('');

    if (result.hasCexTransfers) {
      console.log('✅ CEX transfers found!');
      console.log('');
      result.transfers.forEach((transfer, idx) => {
        console.log(`${idx + 1}. ${transfer.exchange}`);
        console.log(`   Amount: ${transfer.value} ${transfer.token}`);
        console.log(`   TX: ${transfer.txHash}`);
        console.log(`   Time: ${new Date(transfer.timestamp * 1000).toISOString()}`);
        console.log(`   Explorer: https://etherscan.io/tx/${transfer.txHash}`);
        console.log('');
      });
    } else {
      console.log('❌ No direct CEX transfers found');
      console.log('');
      if (result.totalTransactions > 0) {
        console.log('ℹ️  Note: This address may BE an exchange wallet (receiving funds)');
        console.log('   rather than sending TO exchanges. This is normal.');
        console.log('');
      }
      console.log('💡 Try full trace for multi-hop analysis:');
      console.log(`   npm start trace`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
main();