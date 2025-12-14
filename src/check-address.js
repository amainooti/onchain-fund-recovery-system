import dotenv from 'dotenv';
import { BlockchainService } from './infrastructure/blockchain/services/BlockchainService.js';
import { validateAddress } from './utils/validation.js';

dotenv.config();

/**
 * Quick utility to check if an address is suitable for tracing
 * 
 * Usage: nodemon src/check-address.js <address>
 */

async function checkAddress() {
  const address = process.argv[2];

  if (!address) {
    console.log('Usage: node src/check-address.js <address>');
    console.log('');
    console.log('Example:');
    console.log('  node src/check-address.js 0x28C6c06298d514Db089934071355E5743bf21d60');
    process.exit(1);
  }

  console.log('🔍 Checking Address Suitability');
  console.log('='.repeat(70));
  console.log('');

  // Validate
  const validation = validateAddress(address);
  if (!validation.valid) {
    console.log(`❌ Invalid address: ${validation.error}`);
    process.exit(1);
  }

  const checksummedAddress = validation.checksummed;
  console.log(`✅ Valid address: ${checksummedAddress}`);
  console.log('');

  const service = new BlockchainService();

  try {
    // Classify address
    console.log('📋 Classifying address...');
    const classification = await service.classifyAddress(checksummedAddress);

    console.log('');
    console.log('Address Type:');
    if (classification.isContract) {
      console.log('  ⚠️  Smart Contract');
      console.log('');
      console.log('  ⚠️  Warning: Contracts typically do NOT send transactions.');
      console.log('     They receive calls from other addresses.');
      console.log('     This address may not be suitable for fund tracing.');
      console.log('');
    } else {
      console.log('  ✅ EOA (Externally Owned Account)');
      console.log('');
      console.log('  ✅ Good! EOAs can send transactions and be traced.');
      console.log('');
    }

    if (classification.isExchange) {
      console.log(`  🏦 Exchange Wallet: ${classification.exchangeInfo.name}`);
      console.log(`     Exchange: ${classification.exchangeInfo.exchange}`);
      console.log('');
    }

    // Get recent activity
    console.log('📊 Checking recent activity (last 5000 blocks)...');
    const currentBlock = await service.getCurrentBlockNumber();
    const startBlock = currentBlock - 5000;

    const activity = await service.getAddressActivity(checksummedAddress, {
      startBlock,
      endBlock: currentBlock,
      includeZeroValue: false
    });

    console.log('');
    console.log('Recent Activity:');
    console.log(`  Total transactions: ${activity.transactionCount}`);

    // Count outgoing vs incoming
    const outgoing = activity.transactions.filter(
      tx => tx.from.toLowerCase() === checksummedAddress.toLowerCase()
    );
    const incoming = activity.transactions.filter(
      tx => tx.to?.toLowerCase() === checksummedAddress.toLowerCase()
    );

    console.log(`  Outgoing: ${outgoing.length}`);
    console.log(`  Incoming: ${incoming.length}`);
    console.log('');

    // Verdict
    console.log('='.repeat(70));
    console.log('Verdict:');
    console.log('');

    if (classification.isContract) {
      console.log('❌ NOT RECOMMENDED for fund tracing');
      console.log('   Reason: Smart contracts don\'t send transactions like wallets do');
      console.log('');
      console.log('💡 Tip: Use an EOA wallet address instead');
    } else if (outgoing.length === 0) {
      console.log('⚠️  MAY NOT WORK WELL for tracing');
      console.log(`   Reason: No outgoing transactions in last ${currentBlock - startBlock} blocks`);
      console.log('');
      console.log('💡 Tip: Try a wider block range or different address');
    } else if (outgoing.length < 5) {
      console.log('⚠️  LIMITED DATA for tracing');
      console.log(`   Reason: Only ${outgoing.length} outgoing transactions found`);
      console.log('');
      console.log('💡 You can still trace, but results may be limited');
    } else {
      console.log('✅ GOOD for fund tracing!');
      console.log(`   Found ${outgoing.length} outgoing transactions in recent blocks`);
      console.log('');
      console.log('🚀 Ready to trace:');
      console.log(`   npm start trace`);
      console.log('');
      console.log('   Or quick check:');
      console.log(`   npm start quick-check ${checksummedAddress}`);
    }

    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAddress();