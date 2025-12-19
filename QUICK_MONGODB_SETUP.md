# Quick MongoDB Setup

## Your Credentials
- Username: `hrpsi_admin`
- Password: `yV0Ba58>&4£1`

## Quick Command (Run on Server)

```bash
# Edit .env file
nano .env
```

Add this line (password is URL-encoded for special characters):

**For local MongoDB:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr
```

**For remote MongoDB:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@your-server-ip:27017/darmasr
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://hrpsi_admin:yV0Ba58%3E%264%C2%A31@cluster0.xxxxx.mongodb.net/darmasr
```

## Or Use the Setup Script

```bash
# Make sure you're in the project directory
cd /root/darmasr

# Run setup script
./setup-mongodb-env.sh

# Or if MongoDB is on different host:
MONGO_HOST=your-mongodb-host ./setup-mongodb-env.sh
```

## Then Test

```bash
# Check environment
npm run check-env

# Test connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(e => { console.error('❌ Failed:', e.message); process.exit(1); });"

# Seed database
npm run seed:buildings
```

## Password Encoding Explained

Your password `yV0Ba58>&4£1` has special characters:
- `>` = `%3E`
- `&` = `%26`
- `£` = `%C2%A3`

Encoded: `yV0Ba58%3E%264%C2%A31`
