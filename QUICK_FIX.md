# Quick Fix for Client Process Error

If you see `darmasr-client` in "errored" status, follow these steps:

## Quick Fix (Recommended)

Run the automated fix script:
```bash
npm run fix-client
# or
./fix-client.sh
```

Then restart PM2:
```bash
npm run pm2:delete
npm run pm2:start
```

## Manual Fix Steps

### Step 1: Stop PM2 Processes
```bash
pm2 delete all
```

### Step 2: Install/Verify Client Dependencies
```bash
cd client
npm install
cd ..
```

### Step 3: Make Scripts Executable
```bash
chmod +x client/start-vite.sh
chmod +x start.sh
```

### Step 4: Test Vite Manually
```bash
cd client
npm run dev
```

If this works, press `Ctrl+C` to stop it, then continue.

### Step 5: Start PM2 Again
```bash
npm run pm2:start
```

### Step 6: Verify Both Processes
```bash
npm run verify-pm2
```

## Check Logs

If it still fails, check the logs:
```bash
# View client error logs
pm2 logs darmasr-client --err --lines 50

# View all client logs
pm2 logs darmasr-client --lines 100
```

## Common Causes

1. **Missing dependencies**: Run `cd client && npm install`
2. **Vite not installed**: The fix script will handle this
3. **Node/npm not in PATH**: The start-vite.sh script handles this
4. **Port already in use**: Check with `lsof -i :5173`

## Alternative: Use Production Mode

If the dev server keeps failing, use production mode (builds frontend, serves from backend):

```bash
# Build frontend
npm run build

# Start production mode (1 process only)
npm run pm2:start:prod
```

This runs only the backend, which serves the built frontend files.
