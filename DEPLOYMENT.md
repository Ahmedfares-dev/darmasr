# Server Deployment Guide

## Prerequisites

1. **Node.js** (v14 or higher)
2. **PM2** installed globally: `npm install -g pm2`
3. **MongoDB** running (local or remote)
4. **All dependencies** installed

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install-all
```

### 2. Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env file with your actual values
nano .env  # or use your preferred editor
```

**Required variables:**
- `JWT_SECRET` - Secret key for JWT tokens
- `MONGODB_URI` - MongoDB connection string
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name

### 3. Verify Environment Variables

```bash
npm run check-env
```

This will check all required environment variables are set.

### 4. Create Logs Directory

```bash
mkdir -p logs
```

### 5. Start with PM2

```bash
# Start both API and Client
npm run pm2:start
```

### 6. Verify Both Processes Are Running

```bash
# Check status
npm run pm2:status

# Or use verification script
npm run verify-pm2
```

You should see **2 processes**:
- `darmasr-api` - Backend API (port 5000)
- `darmasr-client` - Frontend Vite dev server (port 5173)

### 7. Check Logs

```bash
# View all logs
npm run pm2:logs

# View API logs only
npm run pm2:logs:api

# View Client logs only
npm run pm2:logs:client
```

## Useful Commands

### Start/Stop/Restart

```bash
# Start
npm run pm2:start

# Stop
npm run pm2:stop

# Restart
npm run pm2:restart

# Delete (remove from PM2)
npm run pm2:delete
```

### Monitoring

```bash
# Real-time monitoring
npm run pm2:monit

# Check status
npm run pm2:status

# Verify both processes
npm run verify-pm2
```

### Logs

```bash
# All logs
npm run pm2:logs

# API logs
npm run pm2:logs:api

# Client logs
npm run pm2:logs:client

# Last 100 lines
pm2 logs --lines 100

# Follow logs (real-time)
pm2 logs --follow
```

## Access Points

After starting, you can access:

- **Backend API**: `http://your-server-ip:5000`
- **Frontend**: `http://your-server-ip:5173`
- **Health Check**: `http://your-server-ip:5000/api/health`

## Troubleshooting

### Process Not Starting

1. **Check environment variables:**
   ```bash
   npm run check-env
   ```

2. **Check logs:**
   ```bash
   npm run pm2:logs
   ```

3. **Check if ports are available:**
   ```bash
   # Check if port 5000 is in use
   lsof -i :5000
   
   # Check if port 5173 is in use
   lsof -i :5173
   ```

### Process Keeps Restarting

1. **Check error logs:**
   ```bash
   pm2 logs darmasr-api --err
   pm2 logs darmasr-client --err
   ```

2. **Check memory usage:**
   ```bash
   pm2 monit
   ```

3. **Verify MongoDB connection:**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env`

### Only One Process Running

If you only see one process:

1. **Check if client process crashed:**
   ```bash
   pm2 logs darmasr-client --err
   ```

2. **Restart both:**
   ```bash
   npm run pm2:delete
   npm run pm2:start
   ```

3. **Verify client dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

## Production Setup

For production, you have two options:

### Option 1: Build Frontend and Serve from Backend (Recommended)

```bash
# Build frontend
npm run build

# Start production mode (backend only, serves built frontend)
npm run pm2:start:prod
```

This will:
- Build the React app
- Start only the backend
- Backend serves the built static files
- Only **1 process** running

### Option 2: Keep Both Processes (Development)

```bash
npm run pm2:start
```

This keeps both API and Vite dev server running (**2 processes**).

## Auto-Start on Server Reboot

To make PM2 start automatically on server reboot:

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Firewall Configuration

Make sure your firewall allows connections on:
- Port **5000** (Backend API)
- Port **5173** (Frontend - if using dev server)

```bash
# Example for UFW
sudo ufw allow 5000/tcp
sudo ufw allow 5173/tcp
```

## Nginx Reverse Proxy (Optional)

If you want to use Nginx as a reverse proxy:

```nginx
# /etc/nginx/sites-available/darmasr
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Quick Verification Checklist

- [ ] Dependencies installed (`npm run install-all`)
- [ ] `.env` file configured (`npm run check-env`)
- [ ] Logs directory created (`mkdir -p logs`)
- [ ] PM2 processes started (`npm run pm2:start`)
- [ ] Both processes running (`npm run verify-pm2`)
- [ ] Backend accessible (`curl http://localhost:5000/api/health`)
- [ ] Frontend accessible (open `http://localhost:5173`)
