# MongoDB Setup with Your Credentials

## Your MongoDB Credentials

- **Username:** `hrpsi_admin`
- **Password:** `yV0Ba58>&4£1`
- **Note:** Password contains special characters that need URL encoding

## Quick Setup

### Option 1: Use the Setup Script (Recommended)

```bash
# Run the setup script
./setup-mongodb-env.sh
```

This will automatically:
- Create/update `.env` file
- URL-encode the password
- Set the correct MONGODB_URI format

### Option 2: Manual Setup

Edit your `.env` file:

```bash
nano .env
```

Add this line (password is URL-encoded):

**For local MongoDB:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr
```

**For remote MongoDB server:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@your-server-ip:27017/darmasr
```

**For MongoDB Atlas:**
```env
MONGODB_URI=mongodb+srv://hrpsi_admin:yV0Ba58%3E%264%C2%A31@cluster0.xxxxx.mongodb.net/darmasr
```

## Password URL Encoding

Your password `yV0Ba58>&4£1` contains special characters:
- `>` → `%3E`
- `&` → `%26`
- `£` → `%C2%A3`

So the encoded password is: `yV0Ba58%3E%264%C2%A31`

## Verify Setup

After updating `.env`:

```bash
# Check environment variables
npm run check-env

# Test MongoDB connection
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected successfully!'); process.exit(0); }).catch(e => { console.error('❌ Connection failed:', e.message); process.exit(1); });"
```

## Seed Database

Once connection is verified:

```bash
# Seed buildings
npm run seed:buildings

# Seed admin user
npm run seed:admin
```

## Custom Host/Port

If your MongoDB is on a different host/port:

```bash
MONGO_HOST=your-mongodb-host MONGO_PORT=27017 MONGO_DB=darmasr ./setup-mongodb-env.sh
```

Or manually edit `.env`:
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@your-host:27017/darmasr
```

## Troubleshooting

### If connection still fails:

1. **Check MongoDB is running:**
   ```bash
   # For local MongoDB
   sudo systemctl status mongod
   ```

2. **Test connection with mongosh:**
   ```bash
   mongosh "mongodb://hrpsi_admin:yV0Ba58>&4£1@localhost:27017/darmasr"
   ```

3. **Check firewall:**
   ```bash
   # If MongoDB is on remote server
   sudo ufw allow 27017/tcp
   ```

4. **Verify credentials:**
   - Make sure username `hrpsi_admin` exists
   - Make sure password is correct
   - Make sure user has permissions on `darmasr` database

## Security Note

⚠️ **Never commit `.env` file to git!**

Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> .gitignore
```
