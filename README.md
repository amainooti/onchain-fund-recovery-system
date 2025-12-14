# Crypto Recovery Platform

A comprehensive blockchain fund tracing system for crypto theft victims. Traces stolen funds across the Ethereum blockchain, detects exchange destinations, and generates evidence reports for recovery.

---

## 🎯 **Features**

### **Phase 1: Blockchain Connectivity Layer**
- ✅ Etherscan API V2 integration (transactions, token transfers, internal txs)
- ✅ RPC with automatic failover (Infura → Ankr → 1RPC)
- ✅ CEX hot wallet detection (Binance, Coinbase, Kraken, etc.)
- ✅ Transaction normalization (unified format)
- ✅ Address classification (EOA/Contract/Exchange)

### **Phase 2: Tracing Engine**
- ✅ Multi-hop recursive fund tracing (up to 4 hops)
- ✅ Real-time CEX detection at each hop
- ✅ Pattern analysis (splitting, consolidation, circular flows)
- ✅ Risk scoring (0-100)
- ✅ Transaction graph building
- ✅ Evidence report generation

---

## 🚀 **Quick Start**

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Add your API keys to `.env`:
```env
ETHERSCAN_API_KEY=your_etherscan_api_key
INFURA_RPC_URL=https://mainnet.infura.io/v3/your_project_id
```

### 3. Run Demos

**Show help menu:**
```bash
npm start help
```

**Test blockchain layer:**
```bash
npm start blockchain
```

**Run full fund tracing:**
```bash
npm start trace
```

**Quick CEX check:**
```bash
npm start quick-check 0xYourAddress
```

**Check if address is suitable for tracing:**
```bash
npm run check 0xYourAddress
```
This will tell you if the address is:
- ✅ Good for tracing (EOA with outgoing txs)
- ⚠️ May have limited data
- ❌ Not suitable (contract or no activity)

---

## 📁 **Project Structure**

```
src/
├── infrastructure/
│   └── blockchain/
│       ├── clients/
│       │   ├── EtherscanClient.js      # Etherscan API wrapper
│       │   ├── RpcClient.js            # RPC provider interface
│       │   └── FallbackRpcClient.js    # Auto-failover logic
│       ├── services/
│       │   └── BlockchainService.js    # Main blockchain data service
│       ├── utils/
│       │   ├── Normalizer.js           # Transaction normalization
│       │   └── AddressClassifier.js    # Address type detection
│       └── data/
│           └── known-cex-wallets.json  # CEX wallet database
│
├── services/
│   ├── TracingService.js               # Multi-hop tracing engine
│   └── EvidenceService.js              # Evidence report generator
│
├── models/
│   ├── Trace.js                        # Single hop data model
│   └── TraceResult.js                  # Aggregated results model
│
├── utils/
│   ├── GraphBuilder.js                 # Transaction graph builder
│   └── PathAnalyzer.js                 # Pattern detection
│
├── config/
│   ├── blockchain.config.js            # Blockchain settings
│   └── tracing.config.js               # Tracing settings
│
└── cli.js                              # Unified demo application
|__ server.js
```

---

## 🔧 **Core Services**

### **BlockchainService**
Main interface for blockchain data retrieval:

```javascript
import { BlockchainService } from './infrastructure/blockchain/services/BlockchainService.js';

const service = new BlockchainService();

// Get all activity for an address
const activity = await service.getAddressActivity('0xAddress', {
  startBlock: 0,
  endBlock: 99999999,
  includeZeroValue: false
});

// Classify an address
const classification = await service.classifyAddress('0xAddress');

// Get transaction details
const details = await service.getTransactionDetails('0xTxHash');
```

### **TracingService**
Multi-hop fund tracing engine:

```javascript
import { TracingService } from './services/TracingService.js';

const tracer = new TracingService();

// Quick check for direct CEX transfers (fast)
const quickCheck = await tracer.quickCexCheck('0xAddress');

// Full multi-hop trace (comprehensive)
const trace = await tracer.traceAddress('0xAddress', {
  maxHops: 4,
  startBlock: 0,
  endBlock: 99999999,
  stopAtCex: true  // Stop when CEX is found
});

console.log(`Found ${trace.statistics.cexDestinations} CEX destinations`);
```

### **EvidenceService**
Generate professional evidence reports:

```javascript
import { EvidenceService } from './services/EvidenceService.js';

const evidenceService = new EvidenceService();
const report = evidenceService.generateEvidenceReport(traceResult);

// Report includes:
// - Executive summary
// - CEX findings with contact info
// - Transaction trail
// - Pattern analysis
// - Recommendations
```

---

## 📊 **Output Files**

Running `npm start trace` generates:

1. **`trace-report-RPT-XXX.json`**
   - Professional evidence report
   - CEX contact information
   - Recovery recommendations

2. **`trace-result-XXX.json`**
   - Complete trace data
   - All transactions
   - Statistics

3. **`trace-graph-XXX.json`**
   - Graph visualization data
   - Nodes (addresses) and edges (transactions)
   - Ready for D3.js, Cytoscape, etc.

---

## 🏦 **CEX Detection**

The system includes a database of 18+ known exchange hot wallets:

- **Binance** (6 wallets)
- **Coinbase** (6 wallets)
- **Kraken** (6 wallets)

Add more exchanges in `src/infrastructure/blockchain/data/known-cex-wallets.json`:

```json
{
  "0xaddress": {
    "name": "Exchange Wallet Name",
    "exchange": "Exchange Name"
  }
}
```

---

## 🔍 **Pattern Detection**

The tracing engine automatically detects:

| Pattern | Description | Risk Level |
|---------|-------------|------------|
| **Direct CEX** | Origin → CEX (1 hop) | High recovery chance |
| **Multi-hop CEX** | Origin → ... → CEX | Moderate obfuscation |
| **Splitting** | 1 address → many | Laundering attempt |
| **Consolidation** | Many → 1 address | Fund pooling |
| **Circular** | Funds return to origin | Complex laundering |

---

## ⚙️ **Configuration**

### Blockchain Settings (`src/config/blockchain.config.js`)
```javascript
{
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
    rateLimit: { callsPerSecond: 5 }
  },
  rpc: {
    primary: process.env.INFURA_RPC_URL,
    fallbacks: [ANKR_URL, ONERPC_URL]
  },
  maxHops: 4
}
```

### Tracing Settings (`src/config/tracing.config.js`)
```javascript
{
  maxHops: 4,
  performance: {
    stopAtCex: true,
    includeZeroValue: false
  }
}
```

---

## 🎯 **Use Cases**

### **Victim of Phishing/Hack**
```bash
# Check if stolen funds went to an exchange
npm start quick-check 0xYourWalletAddress

# If funds hit CEX, generate evidence report
npm start trace
```

### **Law Enforcement Investigation**
```bash
# Full trace with pattern analysis
npm start trace

# Review generated evidence reports
# Submit to exchanges with report ID
```

### **Security Researcher**
```bash
# Analyze blockchain connectivity
npm start blockchain

# Study transaction patterns
npm start trace
```

---

## 🚧 **Roadmap**

### **Phase 3: API Layer** (Next)
- [ ] REST API endpoints
- [ ] Authentication/authorization
- [ ] Rate limiting
- [ ] Async job processing

### **Phase 4: Database**
- [ ] Prisma + PostgreSQL
- [ ] Persist traces
- [ ] Cache classifications
- [ ] User management

### **Phase 5: Frontend**
- [ ] React dashboard
- [ ] Interactive transaction graph
- [ ] Real-time tracing progress
- [ ] PDF evidence export

---

## 📝 **Environment Variables**

Required:
```env
ETHERSCAN_API_KEY=     # Get from etherscan.io
INFURA_RPC_URL=        # Get from infura.io
```

Optional (pre-configured fallbacks):
```env
ANKR_RPC_URL=          # Public RPC
ONERPC_URL=            # Public RPC
```

---

## 🧪 **Testing**

### Test Addresses

**Known active address:**
```
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

**Known CEX wallet (Binance):**
```
0x28c6c06298d514db089934071355e5743bf21d60
```

### Run Tests
```bash
# Test blockchain layer
npm start blockchain

# Test with known address
npm start quick-check 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

---

## 🛠️ **Troubleshooting**

### Common Issues

**Trace takes too long?**
- Default uses last 5,000 blocks
- Reduce further: edit `startBlock` in `cli.js`
- Or use: `npm start quick-check` (much faster)

**"Cannot read properties of null"?**
- Fixed in latest version ✅
- Ensure you have latest code

**No transactions found?**
- Verify address on Etherscan first
- Increase block range
- Check address has activity

**See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for complete guide.**

---

## 📚 **Documentation**

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System design & data flow
- **[TRACING-ENGINE.md](./TRACING-ENGINE.md)** - Detailed tracing documentation
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & solutions
- **[PROJECT-STATUS.md](./PROJECT-STATUS.md)** - Current state & roadmap

---

## 🤝 **Contributing**

To add new exchange wallets:
1. Edit `src/infrastructure/blockchain/data/known-cex-wallets.json`
2. Add wallet address with exchange name
3. Submit PR

---

## 📄 **License**

MIT

---

## ⚠️ **Disclaimer**

This tool is for legitimate fund recovery and research purposes only. Always comply with local laws and regulations. The authors are not responsible for misuse of this software.

---

**Built with:** Node.js, Ethers.js, Axios