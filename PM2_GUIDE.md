# PM2 Quick Reference Guide

## Installation

If PM2 is not installed globally:
```bash
npm install -g pm2
```

## Environment Variables Check

Before starting with PM2, always verify your environment variables:
```bash
npm run check-env
```

This script will:
- ✅ Check all required environment variables
- ⚠️  Warn about missing optional variables
- ❌ Exit with error if required variables are missing

## Starting the Application

### Development Mode (Backend + Frontend Dev Server)
This will start both the backend API and the frontend Vite dev server:
```bash
npm run pm2:start
# or explicitly
npm run pm2:start:dev
```

You should see **2 processes**:
- `darmasr-api` - Backend API server (port 5000)
- `darmasr-client` - Frontend Vite dev server (port 5173)

### Production Mode (Backend Only - Serves Built Frontend)
This will build the frontend and start only the backend, which serves the built static files:
```bash
npm run pm2:start:prod
```

You should see **1 process**:
- `darmasr-api` - Backend API server that also serves the built frontend (port 5000)

**Note:** In production mode, the frontend is built and served as static files from the Express server, so you only need one process.

## Managing the Application

### Check Status
```bash
npm run pm2:status
# or
pm2 status
```

### View Logs
```bash
# Real-time logs
npm run pm2:logs

# Last 100 lines
pm2 logs darmasr-api --lines 100

# Error logs only
pm2 logs darmasr-api --err
```

### Restart Application
```bash
npm run pm2:restart
# or
pm2 restart darmasr-api
```

### Stop Application
```bash
npm run pm2:stop
# or
pm2 stop darmasr-api
```

### Delete from PM2
```bash
npm run pm2:delete
# or
pm2 delete darmasr-api
```

### Monitor (Real-time)
```bash
npm run pm2:monit
# or
pm2 monit
```

## Environment Variables

### Required Variables
- `JWT_SECRET` - Secret key for JWT authentication
- `MONGODB_URI` - MongoDB connection string
- `S3_ACCESS_KEY` - S3 access key
- `S3_SECRET_KEY` - S3 secret key
- `S3_BUCKET` - S3 bucket name

### Optional Variables
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `S3_REGION` - S3 region (default: us-central-1)
- `S3_ENDPOINT` - S3 endpoint URL
- `S3_VERIFY_BUCKET` - Verify bucket (default: true)
- `S3_USE_ACL` - Use ACL (default: false)
- `VITE_API_URL` - Frontend API URL

## Setup Checklist

1. ✅ Install PM2 globally: `npm install -g pm2`
2. ✅ Create `.env` file from `.env.example`
3. ✅ Fill in all required environment variables
4. ✅ Run `npm run check-env` to verify
5. ✅ Start with PM2: `npm run pm2:start`

## Troubleshooting

### Application won't start
- Check environment variables: `npm run check-env`
- Check logs: `npm run pm2:logs`
- Verify MongoDB is running
- Verify S3 credentials are correct

### Application crashes
- Check error logs: `pm2 logs darmasr-api --err`
- Check memory usage: `pm2 monit`
- Verify all required environment variables are set

### Environment variables not loading
- Ensure `.env` file exists in root directory
- Check that `env_file: './.env'` is in `ecosystem.config.js`
- The app also loads `.env` via `dotenv` package in `server/index.js`

## Log Files

PM2 logs are stored in:
- Error logs: `./logs/api-error.log`
- Output logs: `./logs/api-out.log`
- Combined logs: `./logs/api-combined.log`

Make sure the `logs` directory exists:
```bash
mkdir -p logs
```

## Advanced PM2 Commands

### Save PM2 process list
```bash
pm2 save
```

### Setup PM2 to start on system boot
```bash
pm2 startup
pm2 save
```

### Reload application (zero-downtime)
```bash
pm2 reload darmasr-api
```

### Scale application
```bash
# Scale to 4 instances
pm2 scale darmasr-api 4
```
