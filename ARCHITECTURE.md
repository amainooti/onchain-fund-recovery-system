# System Architecture

Clean, layered architecture for the crypto recovery platform.

---

## **Layer Diagram**

```
┌─────────────────────────────────────────────────┐
│         APPLICATION LAYER (cli.js)              │
│  - Command-line interface                       │
│  - Demo modes (blockchain, trace, quick-check)  │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         SERVICE LAYER                           │
│  ┌──────────────────┐  ┌───────────────────┐   │
│  │ TracingService   │  │ EvidenceService   │   │
│  │ - Multi-hop trace│  │ - Report gen      │   │
│  │ - CEX detection  │  │ - Recommendations │   │
│  └──────────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│    BLOCKCHAIN SERVICE (Infrastructure)          │
│  ┌──────────────────────────────────────────┐   │
│  │      BlockchainService                   │   │
│  │  - Unified data access                   │   │
│  │  - Address activity                      │   │
│  │  - Address classification                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         DATA SOURCE LAYER                       │
│  ┌────────────┐  ┌──────────────────────────┐   │
│  │ Etherscan  │  │    RPC (with failover)   │   │
│  │   Client   │  │  Infura → Ankr → 1RPC    │   │
│  └────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│         UTILITY LAYER                           │
│  - Normalizer      (data standardization)       │
│  - AddressClassifier (EOA/Contract/CEX)         │
│  - GraphBuilder    (transaction graphs)         │
│  - PathAnalyzer    (pattern detection)          │
└─────────────────────────────────────────────────┘
```

---

## **Data Flow**

### **Example: Full Fund Trace**

```
1. User runs: npm start trace

2. TracingService.traceAddress(address)
   ↓
3. BlockchainService.getAddressActivity(address)
   ↓
4. EtherscanClient.getNormalTransactions(address)
   ↓ (if fails)
   FallbackRpcClient.getLogs(address)
   ↓
5. Normalizer.normalizeBatch(transactions)
   ↓
6. AddressClassifier.classify(to_address)
   ↓
7. Trace.fromTransaction(normalized_tx)
   ↓
8. [RECURSIVE] Steps 2-7 for each outgoing transaction
   ↓
9. GraphBuilder.buildFromTraces(all_traces)
   ↓
10. PathAnalyzer.analyze(all_traces)
    ↓
11. EvidenceService.generateEvidenceReport(result)
    ↓
12. Output: JSON files (report, trace, graph)
```

---

## **Key Components**

### **BlockchainService** (Core Infrastructure)
**Location:** `src/infrastructure/blockchain/services/BlockchainService.js`

**Purpose:** Single point of access for all blockchain data

**Methods:**
- `getAddressActivity(address, options)` - Fetch all transactions
- `classifyAddress(address)` - Determine address type
- `getTransactionDetails(txHash)` - Get tx details
- `getCurrentBlockNumber()` - Latest block

**Used by:** TracingService, cli.js demos

---

### **TracingService** (Tracing Engine)
**Location:** `src/services/TracingService.js`

**Purpose:** Multi-hop recursive fund tracing

**Methods:**
- `traceAddress(address, options)` - Full trace
- `quickCexCheck(address)` - Fast CEX check
- `getGraph()` - Export transaction graph
- `getPatterns()` - Export pattern analysis

**Dependencies:** BlockchainService, GraphBuilder, PathAnalyzer

---

### **EvidenceService** (Reporting)
**Location:** `src/services/EvidenceService.js`

**Purpose:** Generate professional evidence reports

**Methods:**
- `generateEvidenceReport(traceResult)` - Full report
- `formatForPdf(traceResult)` - PDF-ready format

**Output:** Structured JSON with executive summary, CEX findings, recommendations

---

## **Models**

### **Trace** (Single Hop)
```javascript
{
  hopNumber: 2,
  txHash: "0x...",
  from: "0x...",
  to: "0x...",
  value: "1.5",
  tokenSymbol: "ETH",
  isCexDestination: true,
  exchangeName: "Binance"
}
```

### **TraceResult** (Aggregated)
```javascript
{
  originAddress: "0x...",
  traces: [Trace, Trace, ...],
  cexDetections: [...],
  statistics: {
    totalTransactions: 45,
    cexDestinations: 2,
    uniqueAddresses: 23
  },
  patterns: {...},
  pathsToCex: [...]
}
```

---

## **Utilities**

### **Normalizer**
Converts raw data from different sources into unified format

**Input:** Etherscan tx / RPC tx / Token transfer  
**Output:** Standardized transaction object

### **AddressClassifier**
Determines address type with CEX detection

**Input:** Ethereum address  
**Output:** `{ isEOA, isContract, isExchange, exchangeInfo }`

### **GraphBuilder**
Builds directed graph of transaction flows

**Input:** Array of traces  
**Output:** Nodes (addresses) + Edges (transactions)

### **PathAnalyzer**
Detects suspicious patterns

**Input:** Array of traces  
**Output:** Patterns (splitting, consolidation, etc.) + Risk score

---

## **Configuration**

### **blockchain.config.js**
- Etherscan API key
- RPC URLs (primary + fallbacks)
- Rate limits
- Block range limits

### **tracing.config.js**
- Max hops
- Performance settings
- Pattern detection thresholds
- Risk score weights

---

## **Error Handling**

### **Strategy:** Throw errors, let caller handle

```javascript
try {
  const result = await tracingService.traceAddress(address);
} catch (error) {
  console.error('Trace failed:', error.message);
  // Implement retry or fallback
}
```

### **Automatic Failover:**
- Etherscan fails → RPC fallback (logs only)
- Infura fails → Ankr → 1RPC (automatic)

---

## **Why This Design?**

### ✅ **Clear Separation of Concerns**
- Infrastructure layer handles data retrieval
- Service layer handles business logic
- Models handle data structure
- Utils handle processing

### ✅ **Single Responsibility**
- Each service/client has one job
- Easy to test in isolation
- Easy to extend

### ✅ **Dependency Injection**
- Services can be mocked for testing
- Easy to swap implementations

### ✅ **Unified Interface**
- `BlockchainService` is the ONLY interface to blockchain data
- TracingService never calls Etherscan/RPC directly

---

## **Extension Points**

### **Add New Blockchain**
1. Create new clients (e.g., `BscScanClient`, `BscRpcClient`)
2. Update `BlockchainService` with chain parameter
3. Add chain-specific CEX wallets

### **Add New Pattern**
1. Add detection method to `PathAnalyzer`
2. Update risk score weights in config
3. Add to evidence report recommendations

### **Add Database Persistence**
1. Create Prisma schema
2. Add `TraceRepository` service
3. Call from `TracingService` after trace completes

---

## **Next Phase: API Layer**

```
┌─────────────────────────────────────────┐
│         API LAYER (Express)     │
│  POST /api/trace                        │
│  GET  /api/trace/:id                    │
│  GET  /api/quick-check/:address         │
└─────────────────────────────────────────┘
            ↓
    (Uses existing services - no changes needed)
```

Current architecture is **API-ready** - services are already isolated and testable.