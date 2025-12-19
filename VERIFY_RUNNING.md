# How to Verify Both Processes Are Running Correctly

## Quick Verification

### Method 1: Use Verification Script (Recommended)
```bash
npm run verify-pm2
# or
npm run check-status
```

This will show you:
- ✅ Status of both processes
- 📊 Detailed information (PID, uptime, memory, CPU)
- 🌐 Access URLs
- ❌ Any errors or issues

### Method 2: Check PM2 Status
```bash
npm run pm2:status
# or
pm2 list
```

You should see **2 processes**:
- `darmasr-api` - Status should be **online** (green)
- `darmasr-client` - Status should be **online** (green)

### Method 3: Test Endpoints

**Test Backend API:**
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{"status":"OK","message":"Server is running"}
```

**Test Frontend:**
Open in browser: `http://localhost:5173`

Or test with curl:
```bash
curl http://localhost:5173
```

## Detailed Verification Steps

### Step 1: Check PM2 Status
```bash
pm2 list
```

Look for:
- Both processes should show `online` status
- No `errored` or `stopped` status
- Restart count (`↺`) should be low (0-2 is normal)

### Step 2: Check Logs
```bash
# View all logs
npm run pm2:logs

# View API logs only
npm run pm2:logs:api

# View Client logs only
npm run pm2:logs:client

# View only errors
pm2 logs --err
```

Look for:
- ✅ "Server running on port 5000" (API)
- ✅ "Local: http://localhost:5173" (Client)
- ❌ Any error messages

### Step 3: Check Process Details
```bash
# Get detailed info
pm2 describe darmasr-api
pm2 describe darmasr-client

# Check memory and CPU usage
pm2 monit
```

### Step 4: Test Health Endpoint
```bash
# Test API health
curl http://localhost:5000/api/health

# Should return:
# {"status":"OK","message":"Server is running"}
```

### Step 5: Check Ports Are Listening
```bash
# Check if ports are in use
lsof -i :5000  # Backend API
lsof -i :5173  # Frontend

# Or use netstat
netstat -tuln | grep -E ':(5000|5173)'
```

## What to Look For

### ✅ Healthy Status:
- Both processes show `online` status
- Low restart count (0-2)
- No errors in logs
- Health endpoint responds correctly
- Ports are listening

### ❌ Problem Indicators:
- Status shows `errored` or `stopped`
- High restart count (10+)
- Error messages in logs
- Health endpoint doesn't respond
- Ports not listening

## Troubleshooting

### If API is not running:
```bash
# Check API logs
pm2 logs darmasr-api --err

# Restart API
pm2 restart darmasr-api

# Check environment variables
npm run check-env
```

### If Client is not running:
```bash
# Check client logs
pm2 logs darmasr-client --err

# Run fix script
npm run fix-client

# Restart
pm2 restart darmasr-client
```

### If both are not running:
```bash
# Delete all and restart
npm run pm2:delete
npm run pm2:start

# Verify
npm run verify-pm2
```

## Quick Health Check Commands

```bash
# One-liner to check both processes
pm2 list | grep -E "(darmasr-api|darmasr-client)"

# Check if health endpoint responds
curl -s http://localhost:5000/api/health && echo " ✅ API OK" || echo " ❌ API Failed"

# Check if frontend responds
curl -s http://localhost:5173 > /dev/null && echo " ✅ Frontend OK" || echo " ❌ Frontend Failed"
```

## Automated Verification Script

Run this to check everything:
```bash
npm run verify-pm2
```

Or use the shell script:
```bash
./check-status.sh
```

## Expected Output (Healthy)

When everything is running correctly, you should see:

```
✅ Backend API (darmasr-api): online
   PID: 12345
   Uptime: 5m 30s
   Memory: 45.2 MB
   CPU: 0.5%

✅ Frontend Client (darmasr-client): online
   PID: 12346
   Uptime: 5m 30s
   Memory: 32.1 MB
   CPU: 0.3%

✅ Both processes are running correctly!

📍 Access Points:
   Backend API: http://localhost:5000
   Frontend:    http://localhost:5173
   Health Check: http://localhost:5000/api/health
```

## Monitoring

For continuous monitoring:
```bash
# Real-time monitoring
npm run pm2:monit

# Or watch status
watch -n 2 'pm2 list'
```
