#!/usr/bin/env node

/**
 * Test MongoDB connection with authentication
 * This helps debug connection issues
 */

require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('❌ MONGODB_URI not set in .env file');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('Connection string (hidden password):', mongoUri.replace(/:[^:@]+@/, ':****@'));

mongoose.connect(mongoUri, {
  // Remove deprecated options
})
.then(async () => {
  console.log('✅ Connected to MongoDB');
  
  // Test if we can perform operations
  try {
    const db = mongoose.connection.db;
    const adminDb = db.admin();
    
    // Try to list databases (requires authentication)
    const dbs = await adminDb.listDatabases();
    console.log('✅ Authentication successful!');
    console.log('Available databases:', dbs.databases.map(d => d.name).join(', '));
    
    // Try to access the darmasr database
    const collections = await db.listCollections().toArray();
    console.log('✅ Database access successful!');
    console.log('Collections in darmasr:', collections.map(c => c.name).join(', ') || 'None');
    
    await mongoose.connection.close();
    console.log('✅ Connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Operation failed:', error.message);
    console.error('\nThis means:');
    console.error('- Connection works, but user lacks permissions');
    console.error('- Or authentication credentials are incorrect');
    console.error('\nCheck:');
    console.error('1. Username and password are correct');
    console.error('2. User has readWrite permissions on darmasr database');
    console.error('3. authSource might be needed in connection string');
    
    await mongoose.connection.close();
    process.exit(1);
  }
})
.catch(error => {
  console.error('❌ Connection failed:', error.message);
  
  if (error.message.includes('authentication')) {
    console.error('\n⚠️  Authentication error');
    console.error('Check:');
    console.error('1. Username and password in MONGODB_URI');
    console.error('2. Password URL encoding (special characters)');
    console.error('3. User exists in MongoDB');
  } else if (error.message.includes('ECONNREFUSED')) {
    console.error('\n⚠️  Cannot connect to MongoDB server');
    console.error('Check if MongoDB is running');
  }
  
  process.exit(1);
});
