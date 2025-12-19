# Quick Fix: MongoDB Authentication Error

## The Error
```
command aggregate requires authentication
code: 13, codeName: 'Unauthorized'
```

## Quick Fix (3 Steps)

### Step 1: Edit .env file
```bash
nano .env
```

### Step 2: Update MONGODB_URI

**If MongoDB requires authentication, use this format:**
```env
MONGODB_URI=mongodb://username:password@host:port/database
```

**Examples:**

**Local MongoDB with auth:**
```env
MONGODB_URI=mongodb://admin:yourpassword@localhost:27017/darmasr
```

**MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/darmasr
```

**Remote Server:**
```env
MONGODB_URI=mongodb://username:password@your-server-ip:27017/darmasr
```

### Step 3: Run seed again
```bash
npm run seed:buildings
```

## How to Get MongoDB Credentials

### Option 1: MongoDB Atlas (Cloud)
1. Go to MongoDB Atlas dashboard
2. Click "Database Access" → "Add New Database User"
3. Create username/password
4. Copy connection string from "Connect" → "Connect your application"
5. Replace `<password>` with your actual password

### Option 2: Local MongoDB
Create a user:
```bash
mongosh
use darmasr
db.createUser({
  user: "darmasr_user",
  pwd: "yourpassword",
  roles: [ { role: "readWrite", db: "darmasr" } ]
})
```

Then use:
```env
MONGODB_URI=mongodb://darmasr_user:yourpassword@localhost:27017/darmasr
```

## Test Your Connection

```bash
# Check if MONGODB_URI is set correctly
npm run check-env

# Test connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(e => { console.error('❌ Failed:', e.message); process.exit(1); });"
```

## Common Issues

**Issue:** Password has special characters
**Fix:** URL encode them (e.g., `@` → `%40`, `:` → `%3A`)

**Issue:** Still getting auth error
**Fix:** Make sure username/password are correct and user has proper permissions

**Issue:** Connection refused
**Fix:** Check if MongoDB is running: `sudo systemctl status mongod`

## After Fixing

```bash
# Seed buildings
npm run seed:buildings

# Seed admin
npm run seed:admin
```
