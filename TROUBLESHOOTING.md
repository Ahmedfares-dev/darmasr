# Troubleshooting Guide

## Client Process Keeps Crashing (errored status)

If you see `darmasr-client` in "errored" status with many restarts:

### Solution 1: Check Logs
```bash
# View client error logs
pm2 logs darmasr-client --err

# View all client logs
pm2 logs darmasr-client --lines 50
```

### Solution 2: Verify Client Dependencies
```bash
cd client
npm install
cd ..
```

### Solution 3: Check if Vite is Installed
```bash
# Check if vite exists
ls -la client/node_modules/.bin/vite

# If not, install dependencies
cd client && npm install && cd ..
```

### Solution 4: Restart with Clean State
```bash
# Delete all processes
pm2 delete all

# Make sure start script is executable
chmod +x client/start-vite.sh

# Start again
npm run pm2:start
```

### Solution 5: Manual Test
Test if Vite can start manually:
```bash
cd client
npm run dev
```

If this works, the issue is with PM2 configuration. If it doesn't work, fix the Vite installation first.

### Solution 6: Alternative - Use Production Mode
If the dev server keeps failing, use production mode instead:
```bash
# Build frontend
npm run build

# Start production (backend only, serves built frontend)
npm run pm2:start:prod
```

## Common Issues

### Issue: "npm: command not found" in PM2 logs
**Solution:** PM2 can't find npm. Use the shell script approach (already configured in `ecosystem.config.js`).

### Issue: "Cannot find module 'vite'"
**Solution:** 
```bash
cd client
npm install
cd ..
pm2 restart darmasr-client
```

### Issue: Port 5173 already in use
**Solution:**
```bash
# Find what's using the port
lsof -i :5173

# Kill the process or change port in vite.config.js
```

### Issue: Client starts but immediately crashes
**Check:**
1. Node version compatibility (need Node 14+)
2. Memory limits (check `max_memory_restart` in ecosystem.config.js)
3. Check logs for specific error messages

### Issue: Only one process running
**Solution:**
```bash
# Check if client process exists but is errored
pm2 list

# If errored, check logs
pm2 logs darmasr-client --err

# Delete and restart
pm2 delete darmasr-client
npm run pm2:start
```

## Debugging Steps

1. **Check PM2 Status:**
   ```bash
   pm2 list
   ```

2. **Check Logs:**
   ```bash
   pm2 logs --lines 100
   ```

3. **Check Error Logs:**
   ```bash
   pm2 logs darmasr-client --err --lines 50
   ```

4. **Test Manually:**
   ```bash
   # Test backend
   node server/index.js
   
   # Test frontend
   cd client && npm run dev
   ```

5. **Verify Environment:**
   ```bash
   npm run check-env
   ```

6. **Check File Permissions:**
   ```bash
   chmod +x client/start-vite.sh
   chmod +x start.sh
   ```

## Getting Help

If issues persist:
1. Collect logs: `pm2 logs --lines 200 > pm2-logs.txt`
2. Check status: `pm2 list > pm2-status.txt`
3. Check environment: `npm run check-env`
4. Share these files for debugging
