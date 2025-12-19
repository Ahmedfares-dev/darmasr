# Database Seeding Guide

This guide explains how to seed your database with initial data.

## Prerequisites

1. **MongoDB must be running** (local or remote)
2. **Environment variables configured** (`.env` file with `MONGODB_URI`)
3. **Dependencies installed** (`npm install`)

## Available Seed Scripts

### 1. Seed Buildings

Creates 56 buildings (numbered 1-56) in the database.

**Usage:**
```bash
npm run seed:buildings
```

**What it does:**
- Creates 56 buildings with numbers 1-56
- Sets status to 'active' for all buildings
- Skips if buildings already exist (to prevent duplicates)

**Output:**
```
MongoDB Connected
✅ تم إنشاء 56 عماره بنجاح (من 1 إلى 56)
تم إغلاق الاتصال بقاعدة البيانات
```

**Note:** If buildings already exist, you'll see a warning message. To reseed, delete existing buildings first.

### 2. Seed Admin User

Creates a manager/admin user account.

**Basic Usage:**
```bash
npm run seed:admin
```

This creates an admin with default values:
- Phone: `01000000000`
- Password: `admin123`
- Name: `مدير النظام`
- Building: `1`
- Unit: `1`

**Custom Usage:**
```bash
node server/scripts/seedAdmin.js [phone] [password] [name] [buildingNumber] [unit]
```

**Examples:**
```bash
# Custom phone and password
node server/scripts/seedAdmin.js 01234567890 mypassword123

# Full custom
node server/scripts/seedAdmin.js 01234567890 mypassword123 "أحمد فارس" 5 10
```

**Parameters:**
1. `phone` - Phone number (default: 01000000000)
2. `password` - Password (default: admin123)
3. `name` - Full name (default: مدير النظام)
4. `buildingNumber` - Building number (default: 1)
5. `unit` - Unit number (default: 1)

**What it does:**
- Creates a user with `userType: 'manager'`
- Sets `isActive: true`
- Links to specified building and unit
- Skips if admin with same phone already exists

**Output:**
```
MongoDB Connected

✅ تم إنشاء مستخدم المدير بنجاح!
============================================================
الاسم: مدير النظام
رقم الهاتف: 01000000000
كلمة المرور: admin123
العماره: 1
الشقة: 1
============================================================

⚠️  يرجى تغيير كلمة المرور بعد تسجيل الدخول الأول!

تم إغلاق الاتصال بقاعدة البيانات
```

### 3. Seed All (Buildings + Admin)

Runs both seed scripts in sequence.

**Usage:**
```bash
npm run seed:all
```

This will:
1. Seed buildings (if not already seeded)
2. Create admin user (if not already exists)

## Step-by-Step Seeding Process

### Complete Setup (First Time)

```bash
# 1. Make sure MongoDB is running
# Check connection
npm run check-env

# 2. Seed buildings
npm run seed:buildings

# 3. Create admin user
npm run seed:admin

# Or do both at once
npm run seed:all
```

### Verify Seeding

**Check Buildings:**
```bash
# Using MongoDB shell
mongo
use darmasr
db.buildings.count()
db.buildings.find().limit(5)
```

**Check Admin User:**
```bash
# Using MongoDB shell
mongo
use darmasr
db.users.find({ userType: 'manager' })
```

**Or use the API:**
```bash
# Get buildings (requires authentication)
curl http://localhost:5000/api/buildings

# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"01000000000","password":"admin123"}'
```

## Reseeding

### Reseed Buildings

If you need to reseed buildings:

**Option 1: Delete via MongoDB**
```bash
mongo
use darmasr
db.buildings.deleteMany({})
exit
npm run seed:buildings
```

**Option 2: Delete via API** (if you have admin access)
```bash
# Delete all buildings (be careful!)
# This requires authentication and proper permissions
```

### Reseed Admin

If you need to recreate admin:

**Option 1: Delete via MongoDB**
```bash
mongo
use darmasr
db.users.deleteOne({ phone: "01000000000", userType: "manager" })
exit
npm run seed:admin
```

**Option 2: Create with different phone**
```bash
node server/scripts/seedAdmin.js 01111111111 newpassword123
```

## Troubleshooting

### Error: "MongoDB connection failed"

**Solution:**
1. Check MongoDB is running: `mongod` or check your MongoDB service
2. Verify `MONGODB_URI` in `.env` file
3. Test connection: `npm run check-env`

### Error: "Buildings already exist"

**Solution:**
This is normal - the script prevents duplicate buildings. If you want to reseed:
```bash
# Delete existing buildings first
mongo darmasr --eval "db.buildings.deleteMany({})"
npm run seed:buildings
```

### Error: "Admin user already exists"

**Solution:**
The script prevents duplicate admins. To create a new admin:
- Use a different phone number
- Or delete the existing admin first

### Error: "Building not found" (when seeding admin)

**Solution:**
Make sure buildings are seeded first:
```bash
npm run seed:buildings
npm run seed:admin
```

Or use `npm run seed:all` which does both.

### Error: "Phone number validation failed"

**Solution:**
Use a valid Egyptian phone number format:
- Mobile: `01X XXXX XXXX` (e.g., `01012345678`)
- Landline: `02 XXXX XXXX` (e.g., `0212345678`)

## Production Seeding

For production servers:

```bash
# 1. Ensure environment is set
export NODE_ENV=production

# 2. Verify MongoDB connection
npm run check-env

# 3. Seed buildings
npm run seed:buildings

# 4. Create admin with secure password
node server/scripts/seedAdmin.js 01000000000 "SecurePassword123!" "مدير النظام" 1 1

# 5. Verify
mongo your-mongodb-uri --eval "db.buildings.count(); db.users.count({userType:'manager'})"
```

## Security Notes

⚠️ **Important:**
- Change default admin password after first login
- Use strong passwords in production
- Don't commit `.env` file with real credentials
- Consider using environment variables for sensitive data

## Quick Reference

```bash
# Seed buildings only
npm run seed:buildings

# Seed admin only (default values)
npm run seed:admin

# Seed admin (custom)
node server/scripts/seedAdmin.js [phone] [password] [name] [building] [unit]

# Seed everything
npm run seed:all

# Check if seeded
mongo darmasr --eval "db.buildings.count(); db.users.count({userType:'manager'})"
```
