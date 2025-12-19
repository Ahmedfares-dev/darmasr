# Fix: Connection Works But Operations Require Authentication

## The Problem

You see:
```
✅ تم الاتصال بقاعدة البيانات بنجاح
❌ خطأ في زرع البيانات: command aggregate requires authentication
```

This means:
- MongoDB connection is successful
- But the user doesn't have permissions to perform operations
- Or authentication source (authSource) is missing

## Solutions

### Solution 1: Add authSource to Connection String

If your MongoDB user is in the `admin` database, add `authSource=admin`:

```bash
nano .env
```

Update MONGODB_URI:
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr?authSource=admin
```

### Solution 2: Check User Permissions

Verify the user has permissions on the `darmasr` database:

```bash
mongosh "mongodb://hrpsi_admin:yV0Ba58>&4£1@localhost:27017/darmasr"
```

Then check permissions:
```javascript
use darmasr
db.getUser("hrpsi_admin")
```

If user doesn't exist or lacks permissions, create/update:

```javascript
use darmasr
db.createUser({
  user: "hrpsi_admin",
  pwd: "yV0Ba58>&4£1",
  roles: [ { role: "readWrite", db: "darmasr" } ]
})
```

### Solution 3: Test Connection

Run the test script:

```bash
node test-mongodb-connection.js
```

This will show exactly what's wrong.

### Solution 4: Common Connection String Formats

**If user is in admin database:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr?authSource=admin
```

**If user is in darmasr database:**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr?authSource=darmasr
```

**If user is in any database (no authSource needed):**
```env
MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr
```

## Quick Fix Commands

### Step 1: Test Current Connection
```bash
node test-mongodb-connection.js
```

### Step 2: Try Adding authSource
```bash
# Edit .env
nano .env

# Add ?authSource=admin to the end of MONGODB_URI
# Example:
# MONGODB_URI=mongodb://hrpsi_admin:yV0Ba58%3E%264%C2%A31@localhost:27017/darmasr?authSource=admin
```

### Step 3: Test Again
```bash
node test-mongodb-connection.js
npm run seed:buildings
```

## Verify User Permissions

Connect to MongoDB and check:

```bash
mongosh "mongodb://hrpsi_admin:yV0Ba58>&4£1@localhost:27017/darmasr"
```

```javascript
// Check current user
db.runCommand({ connectionStatus: 1 })

// Try to create a test collection
use darmasr
db.test.insertOne({ test: true })

// If this works, permissions are OK
// If it fails, user needs permissions
```

## Update Setup Script

The setup script has been updated. Run it again:

```bash
./setup-mongodb-env.sh
```

Then manually add `?authSource=admin` if needed:

```bash
nano .env
# Add ?authSource=admin to MONGODB_URI
```

## Still Not Working?

1. **Check MongoDB logs:**
   ```bash
   tail -f /var/log/mongodb/mongod.log
   ```

2. **Verify user exists:**
   ```bash
   mongosh
   use admin
   db.getUser("hrpsi_admin")
   ```

3. **Recreate user with proper permissions:**
   ```javascript
   use darmasr
   db.dropUser("hrpsi_admin")
   db.createUser({
     user: "hrpsi_admin",
     pwd: "yV0Ba58>&4£1",
     roles: [ { role: "readWrite", db: "darmasr" } ]
   })
   ```

4. **Test with mongosh directly:**
   ```bash
   mongosh "mongodb://hrpsi_admin:yV0Ba58>&4£1@localhost:27017/darmasr"
   ```
