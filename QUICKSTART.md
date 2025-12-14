# Quick Start Guide

Get up and running in 5 minutes.

---

## **Prerequisites**

- Node.js 18+ installed
- Etherscan API key ([Get one free](https://etherscan.io/apis))
- Infura account ([Sign up free](https://infura.io))

---

## **Installation**

```bash
# 1. Clone/create project folder
cd purple-security

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env and add your keys
# ETHERSCAN_API_KEY=your_key_here
# INFURA_RPC_URL=https://mainnet.infura.io/v3/your_project_id
```

---

## **Basic Commands**

### **Show Help**
```bash
npm start help
```

### **Test Blockchain Layer**
```bash
npm start blockchain
```
Output:
- Current block number ✅
- Address classification ✅
- Recent transactions ✅
- CEX detection ✅

### **Quick CEX Check**
```bash
npm start quick-check 0xYourAddress
```
Fast 1-hop check for direct exchange transfers.

### **Check Address Suitability**
```bash
npm run check 0xYourAddress
```
Checks if an address is good for tracing:
- Validates address format
- Identifies contract vs EOA
- Counts recent outgoing transactions
- Gives verdict on traceability

**Example:**
```bash
npm run check 0x28C6c06298d514Db089934071355E5743bf21d60
# ✅ GOOD for fund tracing!
#    Found 45 outgoing transactions
```

### **Full Fund Trace**
```bash
npm start trace
```
Multi-hop recursive tracing with evidence report.

---

## **Your First Trace**

### **Step 1: Quick Check**
```bash
npm start quick-check 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

If this shows CEX transfers → victim has recovery options!

### **Step 2: Full Trace**
```bash
npm start trace
```

This will:
1. Trace funds up to 3 hops
2. Detect any CEX destinations
3. Analyze patterns
4. Generate 3 files:
   - `trace-report-*.json` (evidence)
   - `trace-result-*.json` (raw data)
   - `trace-graph-*.json` (visualization)

### **Step 3: Review Report**
```bash
cat trace-report-*.json
```

Look for:
- **CEX Findings** → Contact info for exchanges
- **Recommendations** → Next steps for recovery
- **Transaction Trail** → Evidence with Etherscan links

---

## **Real-World Usage**

### **Scenario: Victim of Phishing**

**Victim's story:**
> "I clicked a fake Metamask popup and sent 5 ETH to 0xScammerAddress. Can I get it back?"

**Your workflow:**

```bash
# 1. Check if scammer sent to exchange
npm start quick-check 0xScammerAddress
```

**If CEX found:**
```
✅ CEX transfers found!

1. Binance
   Amount: 5.0 ETH
   TX: 0xabc123...
   Time: 2024-01-15T10:30:00.000Z
```

```bash
# 2. Generate evidence report
npm start trace
```

```bash
# 3. Contact exchange
# Open trace-report-RPT-*.json
# Get exchange contact from report
# Submit ticket with:
#   - Report ID
#   - Transaction hash
#   - Police report (if required)
```

**Recovery prospect:** HIGH (funds at identified exchange)

---

## **Interpreting Results**

### **CEX Detection**
```
🏦 CEX Detections:
  1. Binance (Hop 2)
     Amount: 5.5 ETH
     TX: 0x...
```
✅ **GOOD!** Exchange compliance teams can freeze funds.

### **No CEX Found**
```
❌ No CEX destinations found
```
⚠️ **Limited recovery** - funds in private wallets (harder to track).

### **Pattern Analysis**
```
🔎 Pattern Analysis:
  Risk Level: HIGH
  Risk Score: 75/100
```
🚨 Complex laundering detected - notify law enforcement.

---

## **Common Issues**

### **"Etherscan API Error"**
- Check your API key in `.env`
- Free tier: 5 calls/sec limit
- Upgrade at etherscan.io if needed

### **"No transactions found"**
- Verify address on Etherscan first
- Check block range (may be too narrow)
- Address might have no activity

### **"RPC Error"**
- System auto-fails to backup RPCs
- Check Infura quota
- Fallbacks (Ankr, 1RPC) should work

---

## **What Gets Generated**

Running `npm start trace` creates:

### **1. Evidence Report** (`trace-report-RPT-*.json`)
Professional report for exchange support:
- Executive summary
- CEX findings with contact info
- Complete transaction trail
- Recovery recommendations

### **2. Trace Data** (`trace-result-*.json`)
Raw trace results:
- All transactions
- Hop-by-hop details
- Statistics
- Pattern analysis

### **3. Graph Data** (`trace-graph-*.json`)
Visualization-ready:
- Nodes (addresses)
- Edges (transactions)
- Ready for D3.js, Cytoscape

---

## **Performance Tips**

### **Faster Traces**
```bash
# Use recent blocks only
const currentBlock = await service.getCurrentBlockNumber();
const startBlock = currentBlock - 5000; // Last 5000 blocks
```

### **Stop at CEX**
```javascript
{
  maxHops: 3,
  stopAtCex: true  // Stops when exchange found
}
```

### **Reduce Hops**
```javascript
{
  maxHops: 2  // Only trace 2 levels deep
}
```

---

## **Next Steps**

Once comfortable with the CLI:

1. **[Read ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand system design
2. **[Read TRACING-ENGINE.md](./TRACING-ENGINE.md)** - Deep dive on tracing
3. **Build API Layer** - Expose via REST endpoints
4. **Add Database** - Persist traces with Prisma
5. **Create Frontend** - Build React dashboard

---

## **Need Help?**

### **Documentation**
- `README.md` - Full system overview
- `ARCHITECTURE.md` - System design
- `TRACING-ENGINE.md` - Tracing details

### **Test Address**
Use this for testing (UNI token contract - has activity):
```
0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
```

Or Vitalik's address (very active):
```
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
```

### **Known CEX Wallet**
Test CEX detection with:
```
0x28c6c06298d514db089934071355e5743bf21d60
```
(Binance wallet - should classify as exchange)

---

**You're ready to trace!** 🚀

Start with:
```bash
npm start help
```