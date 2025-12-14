# Troubleshooting Guide

Common issues and solutions.

---

## **Issue: "Invalid address" or "UNCONFIGURED_NAME"**

**Error:**
```
Invalid address: Invalid address checksum
```
or
```
unconfigured name (value="0x742d35cc...")
```

**Cause:** Address is not a valid Ethereum address or has incorrect checksum

**Solutions:**

### **1. Verify address format**
- Must be 42 characters (0x + 40 hex digits)
- Example: `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984`

### **2. Copy from Etherscan**
Always copy addresses directly from Etherscan to ensure correct format.

### **3. Use checksummed addresses**
The system now automatically validates and checksums addresses. If you see "Invalid address checksum" error, copy the address from a reliable source like Etherscan.

### **4. Test with known addresses**
```javascript
// Good test addresses (all valid):
0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984  // UNI token
0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48  // USDC token
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045  // Vitalik
```

---



**Error:**
```
Cannot read properties of null (reading 'toLowerCase')
```

**Cause:** Contract creation transactions have `tx.to = null`

**Fixed in:** Latest version ✅

**Manual fix:** Update `TracingService.js` to check `if (!tx.to) continue;`

---

## **Issue: Trace takes forever / hangs**

**Symptoms:**
- Script runs for 5+ minutes
- Lots of RPC calls
- Says "27,986 transactions"

**Cause:** Address has too much historical activity

**Solutions:**

### **1. Reduce block range** (Recommended)
The demo now defaults to last 5,000 blocks. To customize:

```javascript
// In cli.js, change:
const startBlock = currentBlock - 5000; // Adjust this number

// Or specify directly:
const startBlock = 23000000; // Specific start block
```

### **2. Use quick-check instead of full trace**
```bash
npm start quick-check 0xYourAddress
```
Quick-check only checks 100 most recent outgoing transactions.

### **3. Change test address**
Edit `cli.js`:
```javascript
const testAddress = '0xYourAddressHere';
```

Use an address with less activity for faster results.

---

## **Issue: "Etherscan API Error"**

**Error:**
```
Etherscan API Error: Max rate limit reached
```

**Cause:** Free tier allows 5 calls/second

**Solutions:**

### **1. Wait a moment and retry**
Rate limits reset quickly.

### **2. Upgrade Etherscan plan**
Visit [etherscan.io](https://etherscan.io/apis) for paid tiers.

### **3. Use smaller block ranges**
Fewer blocks = fewer API calls.

---

## **Issue: "RPC Error" or "All providers failed"**

**Error:**
```
All RPC providers failed for getLogs
```

**Cause:** 
- Infura quota exceeded
- Public RPCs rate limiting

**Solutions:**

### **1. Check Infura dashboard**
Verify you haven't hit your daily quota.

### **2. Wait and retry**
Rate limits reset hourly/daily.

### **3. Get better RPC endpoints**
- Alchemy (free tier)
- QuickNode (free tier)
- Your own node

Update `.env`:
```env
INFURA_RPC_URL=your_alchemy_url
```

---

## **Issue: No transactions found**

**Output:**
```
Found 0 transactions
Normalized 0 transactions
```

**Causes:**

### **1. Address is a smart contract**
**Problem:** Contracts receive calls but don't "send" transactions in the traditional sense.

**Example bad addresses:**
- `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` (UNI token - contract)
- `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC token - contract)

**Solution:** Use an EOA (externally owned account) instead:
```javascript
// Good: Binance hot wallet (EOA, sends txs)
0x28C6c06298d514Db089934071355E5743bf21d60

// Good: MEV bot (EOA, very active)
0x000000000035B5e5ad9019092C665357240f594e

// Good: Your own wallet
0xYourWalletAddress
```

**How to check:** On Etherscan, look at the "Transactions" tab. If it shows outgoing transactions (green arrow →), it's good for tracing.

### **2. Address has no activity in block range**
Verify on [Etherscan](https://etherscan.io) first.

### **3. Block range too narrow**
```javascript
// Increase range
const startBlock = currentBlock - 50000; // More blocks
```

### **4. Address is too new**
If address was created after your `startBlock`, widen the range.

---

## **Issue: "No CEX destinations found"**

**Output:**
```
❌ No CEX destinations found in trace
```

**This is normal if:**
- Funds went to private wallets (not exchanges)
- Funds haven't moved yet
- CEX wallet not in our database

**Solutions:**

### **1. Check manually on Etherscan**
Follow the transaction trail yourself.

### **2. Expand CEX database**
Add missing exchanges to `known-cex-wallets.json`:
```json
{
  "0xnewwallet": {
    "name": "Exchange Name",
    "exchange": "ExchangeName"
  }
}
```

### **3. Use full trace instead of quick-check**
```bash
npm start trace
```
Traces multiple hops to find eventual CEX destinations.

---

## **Issue: Out of memory**

**Error:**
```
JavaScript heap out of memory
```

**Cause:** Processing too many transactions at once

**Solutions:**

### **1. Reduce block range**
```javascript
const startBlock = currentBlock - 1000; // Smaller range
```

### **2. Increase Node memory**
```bash
node --max-old-space-size=4096 src/cli.js trace
```

### **3. Process in batches**
Manually split into multiple traces:
- Blocks 23000000-23010000
- Blocks 23010000-23020000
- etc.

---

## **Issue: Wrong address classification**

**Example:**
```
Address classified as Contract but it's actually EOA
```

**Cause:** Classification cache or RPC error

**Solutions:**

### **1. Clear cache**
Restart the script (cache is in-memory only).

### **2. Verify on Etherscan**
Check if address is actually a contract.

### **3. Report bug**
If consistently wrong, file an issue with the address.

---

## **Performance Issues**

### **Slow traces (general)**

**Check these:**
- Block range too large → reduce to 5,000 blocks
- Too many hops → reduce `maxHops` to 2
- Address too active → use different test address

**Speed it up:**
```javascript
{
  maxHops: 2,              // Instead of 4
  stopAtCex: true,         // Stop when CEX found
  startBlock: current - 5000  // Recent blocks only
}
```

### **Too many RPC calls**

**Issue:** Classifying thousands of addresses

**Current fix:** Quick-check now limits to 100 classifications

**Manual limit:**
```javascript
// In TracingService, add:
const maxToCheck = 50; // Reduce for faster checks
```

---

## **Environment Issues**

### **Missing API keys**

**Error:**
```
ETHERSCAN_API_KEY is required
```

**Fix:**
```bash
# Copy template
cp .env.example .env

# Edit and add keys
nano .env
```

### **Invalid API key**

**Error:**
```
Invalid API Key
```

**Fix:**
- Verify key on etherscan.io
- Check for extra spaces in `.env`
- Regenerate key if needed

---

## **Demo Address Issues**

### **Default address has too much activity**

**Current demo address:** `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` (UNI token)

**To change:** Edit `src/cli.js`:
```javascript
const testAddress = '0xYourAddressHere';
```

**Good test addresses:**
- `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` - UNI token (moderate)
- `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` - USDC token (active)
- `0xdAC17F958D2ee523a2206206994597C13D831ec7` - USDT token (very active)
- Your own wallet address (if you want to trace your funds)

---

## **Debug Mode**

### **Enable verbose logging**

Add this to see detailed execution:

```javascript
// In cli.js, add at top:
process.env.DEBUG = 'true';

// Then add logging in services:
if (process.env.DEBUG) {
  console.log('[DEBUG]', data);
}
```

### **Check individual components**

Test each layer separately:

```bash
# Test blockchain layer only
npm start blockchain

# Test specific address
npm start quick-check 0xSpecificAddress
```

---

## **Common Gotchas**

### **1. Contract creation transactions**
- Have `tx.to = null`
- Can't be traced
- Now filtered out ✅

### **2. Rate limits**
- Etherscan: 5 calls/sec (free)
- Infura: ~100k calls/day (free)
- Plan accordingly

### **3. Large addresses**
- Some addresses have 50k+ transactions
- Use recent blocks only
- Consider pagination (future feature)

### **4. CEX detection**
- Only detects KNOWN wallets
- Database needs expansion
- Many exchanges not included yet

---

## **Still Having Issues?**

### **Check versions**
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### **Reinstall dependencies**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **Check logs carefully**
Look for:
- `[ERROR]` messages
- Stack traces
- API error responses

### **Test with minimal example**
```javascript
// Test just BlockchainService
const service = new BlockchainService();
const block = await service.getCurrentBlockNumber();
console.log(block); // Should print a number
```

---

## **Known Limitations**

These are **expected** behaviors (not bugs):

1. ✅ Quick-check only checks 100 transactions (for speed)
2. ✅ Full trace can take 2-5 minutes for deep history
3. ✅ CEX database is limited (18 wallets currently)
4. ✅ Only supports Ethereum mainnet
5. ✅ No multi-chain support yet
6. ✅ Internal transactions require Etherscan (no RPC fallback)

---

**Need more help?** Check other docs:
- [QUICKSTART.md](./QUICKSTART.md) - Basic usage
- [ARCHITECTURE.md](./ARCHITECTURE.md) - How it works
- [README.md](./README.md) - Full overview