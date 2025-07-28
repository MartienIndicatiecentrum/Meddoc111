// auto-start-services.js - Automatically start backend services
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Check if port is in use
async function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Wait for service to be ready
async function waitForService(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const http = require('http');
      const response = await new Promise((resolve, reject) => {
        http.get(url, (res) => {
          resolve(res.statusCode === 200);
        }).on('error', () => {
          resolve(false);
        });
      });
      
      if (response) return true;
    } catch (error) {
      // Service not ready yet
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Start service if not running
async function ensureServiceRunning(config) {
  const { name, port, command, args, checkUrl, color = colors.cyan } = config;
  
  const inUse = await isPortInUse(port);
  
  if (inUse) {
    console.log(`${color}✓${colors.reset} ${name} already running on port ${port}`);
    return true;
  }
  
  console.log(`${color}↻${colors.reset} Starting ${name}...`);
  
  // Start the service
  const isWindows = process.platform === 'win32';
  const cmd = isWindows && command === 'npm' ? 'npm.cmd' : command;
  
  const proc = spawn(cmd, args, {
    detached: true,
    stdio: 'ignore',
    shell: isWindows,
    cwd: process.cwd()
  });
  
  proc.unref();
  
  // Wait for service to be ready
  if (checkUrl) {
    const ready = await waitForService(checkUrl);
    if (ready) {
      console.log(`${color}✓${colors.reset} ${name} is ready`);
      return true;
    } else {
      console.log(`${colors.yellow}⚠${colors.reset} ${name} started but not responding`);
      return false;
    }
  } else {
    // Just wait a bit for process to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(`${color}✓${colors.reset} ${name} started`);
    return true;
  }
}

async function main() {
  console.log(`${colors.bright}🚀 Auto-starting backend services...${colors.reset}\n`);
  
  // Check environment first
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.warn(`${colors.yellow}⚠️  No .env file found${colors.reset}`);
    console.log('   Services may not work properly without configuration.');
    console.log('   Run "npm run check:env" for setup help.\n');
  } else if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(`${colors.yellow}⚠️  Missing required environment variables${colors.reset}`);
    console.log('   Backend API will not work without Supabase credentials.');
    console.log('   Run "npm run check:env" for setup help.\n');
  }
  
  // Services to start
  const services = [
    {
      name: 'Backend API',
      port: 8081,
      command: 'node',
      args: ['server.js'],
      checkUrl: 'http://localhost:8081/health',
      color: colors.green
    },
    {
      name: 'RAG Server',
      port: 5000,
      command: 'python',
      args: ['advanced_rag_server.py'],
      checkUrl: 'http://localhost:5001/health',
      color: colors.yellow
    }
  ];
  
  // Check for Python before trying to start RAG server
  const pythonAvailable = await checkPythonInstallation();
  if (!pythonAvailable) {
    console.warn(`${colors.yellow}⚠️  Python not found${colors.reset}`);
    console.log('   RAG Server requires Python 3.x');
    console.log('   Document upload features will not work.\n');
    // Remove RAG server from services
    services.splice(1, 1);
  }
  
  // Start all services
  const results = await Promise.all(
    services.map(service => ensureServiceRunning(service))
  );
  
  const allSuccessful = results.every(r => r);
  
  if (allSuccessful) {
    console.log(`\n${colors.green}✅ All services ready!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some services may not be fully ready${colors.reset}`);
    process.exit(1);
  }
}

// Check if Python is installed
function checkPythonInstallation() {
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    
    python.on('error', () => {
      resolve(false);
    });
    
    python.stdout.on('data', () => {
      resolve(true);
    });
    
    python.stderr.on('data', (data) => {
      // Python sometimes outputs version to stderr
      if (data.toString().includes('Python')) {
        resolve(true);
      }
    });
    
    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
}

// Run only if called directly
if (require.main === module) {
  main().catch(err => {
    console.error(`${colors.red}Error:${colors.reset}`, err.message);
    process.exit(1);
  });
}