# Fix MongoDB Authentication Error

If you're getting `command aggregate requires authentication` error, your MongoDB connection string needs authentication credentials.

## The Problem

The error means MongoDB requires authentication, but your connection string doesn't include username and password.

## Solution

### Step 1: Update Your .env File

Your `MONGODB_URI` must include username and password in the format:

**For Local MongoDB:**
```env
MONGODB_URI=mongodb://username:password@localhost:27017/darmasr
```

**For MongoDB Atlas (Cloud):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/darmasr
```

**For Remote MongoDB Server:**
```env
MONGODB_URI=mongodb://username:password@your-server-ip:27017/darmasr
```

### Step 2: Get Your MongoDB Credentials

**If using MongoDB Atlas:**
1. Go to your MongoDB Atlas dashboard
2. Click "Database Access" → Create Database User
3. Create username and password
4. Copy the connection string and replace `<password>` with your actual password

**If using local MongoDB:**
1. Connect to MongoDB shell: `mongo` or `mongosh`
2. Create admin user:
   ```javascript
   use admin
   db.createUser({
     user: "admin",
     pwd: "yourpassword",
     roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
   })
   ```
3. Or create user for specific database:
   ```javascript
   use darmasr
   db.createUser({
     user: "darmasr_user",
     pwd: "yourpassword",
     roles: [ { role: "readWrite", db: "darmasr" } ]
   })
   ```

### Step 3: Update .env File

Edit your `.env` file:
```bash
nano .env
# or
vi .env
```

Add/update the MONGODB_URI:
```env
MONGODB_URI=mongodb://darmasr_user:yourpassword@localhost:27017/darmasr
```

**Important:** 
- Replace `darmasr_user` with your MongoDB username
- Replace `yourpassword` with your MongoDB password
- Replace `localhost:27017` with your MongoDB server address if different

### Step 4: Test Connection

```bash
# Check environment variables
npm run check-env

# Try seeding again
npm run seed:buildings
```

## Common Connection String Formats

### Local MongoDB (No Auth)
```env
MONGODB_URI=mongodb://localhost:27017/darmasr
```

### Local MongoDB (With Auth)
```env
MONGODB_URI=mongodb://username:password@localhost:27017/darmasr
```

### MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/darmasr?retryWrites=true&w=majority
```

### Remote Server
```env
MONGODB_URI=mongodb://username:password@192.168.1.100:27017/darmasr
```

## Special Characters in Password

If your password contains special characters, URL encode them:

**Special Characters:**
- `@` → `%40`
- `:` → `%3A`
- `/` → `%2F`
- `#` → `%23`
- `?` → `%3F`
- `&` → `%26`
- `=` → `%3D`

**Example:**
If password is `p@ssw:rd`, use:
```env
MONGODB_URI=mongodb://user:p%40ssw%3Ard@localhost:27017/darmasr
```

## Verify Your Connection String

You can test your connection string format:

```bash
# Test if MongoDB URI is set
echo $MONGODB_URI

# Or check .env file
cat .env | grep MONGODB_URI
```

## Quick Fix Script

Create a test connection script:

```bash
# Create test-connection.js
cat > test-connection.js << 'EOF'
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connection successful!');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Connection failed:', err.message);
  process.exit(1);
});
EOF

# Run it
node test-connection.js
```

## After Fixing

Once you've updated your `.env` file:

```bash
# 1. Verify environment
npm run check-env

# 2. Seed buildings
npm run seed:buildings

# 3. Seed admin
npm run seed:admin
```

## Still Having Issues?

1. **Check MongoDB is running:**
   ```bash
   # For local MongoDB
   sudo systemctl status mongod
   # or
   ps aux | grep mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

3. **Test connection manually:**
   ```bash
   mongosh "mongodb://username:password@localhost:27017/darmasr"
   ```

4. **Check firewall:**
   ```bash
   # If MongoDB is on remote server
   sudo ufw allow 27017/tcp
   ```

## Security Note

⚠️ **Never commit your `.env` file with real credentials to git!**

Make sure `.env` is in `.gitignore`:
```bash
echo ".env" >> .gitignore
```
