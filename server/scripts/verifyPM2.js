#!/usr/bin/env node

/**
 * PM2 Verification Script
 * Verifies that both API and Client processes are running correctly
 */

const { execSync } = require('child_process');

console.log('\n🔍 Verifying PM2 Processes...\n');
console.log('='.repeat(60));

try {
  // Get PM2 list
  const pm2List = execSync('pm2 jlist', { encoding: 'utf-8' });
  const processes = JSON.parse(pm2List);

  const apiProcess = processes.find(p => p.name === 'darmasr-api');
  const clientProcess = processes.find(p => p.name === 'darmasr-client');

  let allGood = true;

  // Check API
  console.log('\n📡 Backend API (darmasr-api):');
  console.log('-'.repeat(60));
  if (apiProcess) {
    const status = apiProcess.pm2_env.status;
    const uptime = Math.floor(apiProcess.pm2_env.pm_uptime / 1000);
    const restarts = apiProcess.pm2_env.restart_time;
    
    if (status === 'online') {
      console.log(`✅ Status: ${status}`);
      console.log(`   PID: ${apiProcess.pid}`);
      console.log(`   Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`);
      console.log(`   Restarts: ${restarts}`);
      console.log(`   Memory: ${(apiProcess.monit.memory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   CPU: ${apiProcess.monit.cpu}%`);
    } else {
      console.log(`❌ Status: ${status}`);
      allGood = false;
    }
  } else {
    console.log('❌ Process not found!');
    allGood = false;
  }

  // Check Client
  console.log('\n💻 Frontend Client (darmasr-client):');
  console.log('-'.repeat(60));
  if (clientProcess) {
    const status = clientProcess.pm2_env.status;
    const uptime = Math.floor(clientProcess.pm2_env.pm_uptime / 1000);
    const restarts = clientProcess.pm2_env.restart_time;
    
    if (status === 'online') {
      console.log(`✅ Status: ${status}`);
      console.log(`   PID: ${clientProcess.pid}`);
      console.log(`   Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`);
      console.log(`   Restarts: ${restarts}`);
      console.log(`   Memory: ${(clientProcess.monit.memory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   CPU: ${clientProcess.monit.cpu}%`);
    } else {
      console.log(`❌ Status: ${status}`);
      allGood = false;
    }
  } else {
    console.log('❌ Process not found!');
    allGood = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allGood && apiProcess && clientProcess) {
    console.log('\n✅ Both processes are running correctly!');
    console.log('\n📍 Access Points:');
    console.log('   Backend API: http://localhost:5000');
    console.log('   Frontend:    http://localhost:5173');
    console.log('   Health Check: http://localhost:5000/api/health\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some processes are not running correctly!');
    console.log('\n💡 Try running:');
    console.log('   npm run pm2:restart');
    console.log('   npm run pm2:logs\n');
    process.exit(1);
  }
} catch (error) {
  console.error('\n❌ Error checking PM2 processes:', error.message);
  console.log('\n💡 Make sure PM2 is installed and processes are running:');
  console.log('   npm run pm2:start\n');
  process.exit(1);
}
