const path = require('path');

module.exports = {
  apps: [
    {
      name: 'darmasr-api',
      script: path.join(__dirname, 'server/index.js'),
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // PM2 will load .env file automatically
      env_file: path.join(__dirname, '.env'),
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: path.join(__dirname, 'logs/api-error.log'),
      out_file: path.join(__dirname, 'logs/api-out.log'),
      log_file: path.join(__dirname, 'logs/api-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'darmasr-client',
      script: path.join(__dirname, 'client/start-vite.sh'),
      interpreter: '/bin/bash',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0',
        PORT: 5173
      },
      error_file: path.join(__dirname, 'logs/client-error.log'),
      out_file: path.join(__dirname, 'logs/client-out.log'),
      log_file: path.join(__dirname, 'logs/client-combined.log'),
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000
    }
  ]
};
