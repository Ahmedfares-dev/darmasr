#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Checks if all required environment variables are set
 */

require('dotenv').config();

const requiredVars = {
  // Core
  JWT_SECRET: 'Required for JWT token generation and verification',
  MONGODB_URI: 'Required for MongoDB connection (or will use default)',
  
  // S3/File Storage
  S3_ACCESS_KEY: 'Required for S3 file uploads',
  S3_SECRET_KEY: 'Required for S3 file uploads',
  S3_BUCKET: 'Required for S3 file uploads',
};

const optionalVars = {
  PORT: 'Server port (default: 5000)',
  NODE_ENV: 'Environment mode (default: development)',
  S3_REGION: 'S3 region (default: us-central-1)',
  S3_ENDPOINT: 'S3 endpoint (default: https://usc1.contabostorage.com)',
  S3_VERIFY_BUCKET: 'Verify bucket exists (default: true)',
  S3_USE_ACL: 'Use ACL for S3 (default: false)',
  VITE_API_URL: 'Frontend API URL (default: http://localhost:5001/api)',
};

let hasErrors = false;
let hasWarnings = false;

console.log('\n🔍 Checking Environment Variables...\n');
console.log('='.repeat(60));

// Check required variables
console.log('\n📋 Required Variables:');
console.log('-'.repeat(60));

for (const [varName, description] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`❌ ${varName}: MISSING - ${description}`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('KEY')
      ? '*'.repeat(Math.min(value.length, 20))
      : value.length > 50
      ? value.substring(0, 50) + '...'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
}

// Check optional variables
console.log('\n📝 Optional Variables:');
console.log('-'.repeat(60));

for (const [varName, description] of Object.entries(optionalVars)) {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`⚠️  ${varName}: Not set - ${description}`);
    hasWarnings = true;
  } else {
    const displayValue = value.length > 50
      ? value.substring(0, 50) + '...'
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('\n❌ ERRORS FOUND: Some required environment variables are missing!');
  console.log('   Please check your .env file and ensure all required variables are set.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  WARNINGS: Some optional variables are not set.');
  console.log('   The application will use default values for missing optional variables.\n');
  process.exit(0);
} else {
  console.log('\n✅ All environment variables are properly configured!\n');
  process.exit(0);
}
