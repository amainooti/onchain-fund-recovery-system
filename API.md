# API Documentation

REST API for blockchain fund tracing and recovery.

---

## **Base URL**

```
http://localhost:3000/api
```

---

## **Getting Started**

### **1. Install Dependencies**
```bash
npm install
```

### **2. Install Redis**

**macOS:**
```bash
brew install redis
brew services start redis
```

**Ubuntu/Debian:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

**Windows:**
Download from [Redis.io](https://redis.io/download)

### **3. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your API keys
```

### **4. Start Server**
```bash
npm run server
```

Server runs on `http://localhost:3000`

---

## **Endpoints**

### **POST /api/trace**
Start a new fund trace job (async).

**Request:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "maxHops": 3,
  "startBlock": 23000000,
  "endBlock": 23500000,
  "stopAtCex": true,
  "maxTransactionsPerHop": 20
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Trace job started",
  "data": {
    "jobId": "trace_1234567890_abc123",
    "status": "queued",
    "statusUrl": "/api/trace/trace_1234567890_abc123/status",
    "resultUrl": "/api/trace/trace_1234567890_abc123"
  }
}
```

---

### **GET /api/trace/:id/status**
Check trace job status.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "trace_1234567890_abc123",
    "status": "active",
    "progress": 45,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Possible statuses:**
- `waiting` - In queue
- `active` - Processing
- `completed` - Finished
- `failed` - Error occurred
- `delayed` - Delayed retry

---

### **GET /api/trace/:id**
Get trace results.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "jobId": "trace_1234567890_abc123",
    "trace": {
      "originAddress": "0x...",
      "traces": [...],
      "cexDetections": [...],
      "statistics": {...}
    },
    "evidence": {
      "reportId": "RPT-...",
      "executiveSummary": {...},
      "cexFindings": {...}
    },
    "graph": {
      "nodes": [...],
      "edges": [...]
    },
    "completedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

**Response (202 Accepted - Still Processing):**
```json
{
  "success": false,
  "message": "Trace still processing",
  "data": {
    "jobId": "trace_1234567890_abc123",
    "status": "active",
    "statusUrl": "/api/trace/trace_1234567890_abc123/status"
  }
}
```

---

### **DELETE /api/trace/:id**
Cancel a trace job.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Trace cancelled"
}
```

---

### **GET /api/quick-check/:address**
Quick CEX check (synchronous, returns immediately).

**Example:**
```
GET /api/quick-check/0x28C6c06298d514Db089934071355E5743bf21d60
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "address": "0x28c6c06298d514db089934071355e5743bf21d60",
    "hasCexTransfers": true,
    "cexTransferCount": 5,
    "transfers": [
      {
        "txHash": "0x...",
        "exchange": "Binance",
        "exchangeWallet": "Binance 14",
        "value": "5.5",
        "token": "ETH",
        "timestamp": 1705315200,
        "blockNumber": 23000000
      }
    ],
    "checkedCount": 100,
    "totalTransactions": 12335
  }
}
```

---

### **GET /api/classify/:address**
Classify an address (EOA/Contract/CEX).

**Example:**
```
GET /api/classify/0x28C6c06298d514Db089934071355E5743bf21d60
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "address": "0x28c6c06298d514db089934071355e5743bf21d60",
    "isContract": false,
    "isEOA": true,
    "isExchange": true,
    "exchangeInfo": {
      "isExchange": true,
      "name": "Binance 14",
      "exchange": "Binance"
    }
  }
}
```

---

### **GET /api/health**
Health check.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API is healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## **Error Responses**

### **400 Bad Request**
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "address",
      "message": "Must be a valid Ethereum address"
    }
  ]
}
```

### **404 Not Found**
```json
{
  "success": false,
  "error": "Trace not found"
}
```

### **429 Too Many Requests**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## **Rate Limiting**

- **100 requests per 15 minutes per IP**
- Headers included:
  - `X-RateLimit-Limit` - Total requests allowed
  - `X-RateLimit-Remaining` - Requests remaining
  - `X-RateLimit-Reset` - Time when limit resets

---

## **cURL Examples**

### **Start Trace**
```bash
curl -X POST http://localhost:3000/api/trace \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "maxHops": 2,
    "stopAtCex": true
  }'
```

### **Check Status**
```bash
curl http://localhost:3000/api/trace/trace_1234567890_abc123/status
```

### **Get Results**
```bash
curl http://localhost:3000/api/trace/trace_1234567890_abc123
```

### **Quick Check**
```bash
curl http://localhost:3000/api/quick-check/0x28C6c06298d514Db089934071355E5743bf21d60
```

### **Classify Address**
```bash
curl http://localhost:3000/api/classify/0x28C6c06298d514Db089934071355E5743bf21d60
```

---

## **JavaScript Examples**

### **Using Fetch**
```javascript
// Start trace
const response = await fetch('http://localhost:3000/api/trace', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    maxHops: 2,
    stopAtCex: true
  })
});

const data = await response.json();
console.log('Job ID:', data.data.jobId);

// Check status
const statusResponse = await fetch(
  `http://localhost:3000/api/trace/${data.data.jobId}/status`
);
const status = await statusResponse.json();
console.log('Status:', status.data.status);
```

### **Using Axios**
```javascript
import axios from 'axios';

// Start trace
const { data } = await axios.post('http://localhost:3000/api/trace', {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  maxHops: 2,
  stopAtCex: true
});

console.log('Job ID:', data.data.jobId);

// Poll for results
const pollResults = async (jobId) => {
  while (true) {
    const { data } = await axios.get(`http://localhost:3000/api/trace/${jobId}`);
    
    if (data.success) {
      return data.data; // Completed
    }
    
    // Still processing, wait and retry
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};

const results = await pollResults(data.data.jobId);
console.log('Trace complete:', results);
```

---

## **Interactive API Docs**

Visit **http://localhost:3000/api-docs** for interactive Swagger documentation where you can:
- View all endpoints
- Try API calls directly
- See request/response schemas
- Test with different parameters

---

## **Job Queue (Bull/Redis)**

### **How It Works**
1. Client submits trace request
2. Job added to Redis queue
3. API returns job ID immediately (202 Accepted)
4. Worker processes job in background
5. Client polls for results

### **Benefits**
- ✅ Non-blocking - API responds instantly
- ✅ Fault-tolerant - Jobs survive server restarts
- ✅ Scalable - Add more workers
- ✅ Progress tracking - Real-time status updates

### **Monitoring Jobs**
```javascript
// In your code
import { traceQueue } from './api/queues/traceQueue.js';

// Get queue stats
const waiting = await traceQueue.getWaitingCount();
const active = await traceQueue.getActiveCount();
const completed = await traceQueue.getCompletedCount();
const failed = await traceQueue.getFailedCount();

console.log({ waiting, active, completed, failed });
```

---

## **Production Deployment**

### **Environment Variables**
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=https://yourdomain.com
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### **PM2 (Process Manager)**
```bash
npm install -g pm2
pm2 start src/server.js --name crypto-api
pm2 save
pm2 startup
```

### **Docker**
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "server"]
```

---

## **Troubleshooting**

### **Redis Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:** Start Redis: `brew services start redis` (macOS) or `sudo systemctl start redis` (Linux)

### **Job Stuck**
**Solution:** Check Redis, restart queue: `pm2 restart crypto-api`

### **Rate Limit Hit**
**Solution:** Wait 15 minutes or use different IP

---

## **Next Steps**

- Add authentication (JWT tokens)
- Add database (Prisma + PostgreSQL)
- Add webhook notifications
- Add PDF generation
- Deploy to production

---

**Need help?** Check the main [README.md](./README.md) or [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)