#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Service configurations with port ranges
const services = [
  {
    name: 'Backend',
    command: 'node',
    args: ['server.js'],
    cwd: __dirname,
    color: colors.green,
    defaultPort: 8081,
    portRange: [8081, 8090], // Try ports 8081-8090
    readyMessage: 'MedDoc AI Chatbot Server running'
  },
  {
    name: 'RAG Server',
    command: 'C:\\Users\\shadow\\AppData\\Local\\Programs\\Python\\Python311\\python.exe',
    args: ['advanced_rag_server.py'],
    cwd: __dirname,
    color: colors.yellow,
    defaultPort: 5001,
    portRange: [5001, 5010], // Try ports 5001-5010
    readyMessage: 'Running on'
  },
  {
    name: 'Frontend',
    command: 'npm',
    args: ['run', 'dev:frontend'],
    cwd: __dirname,
    color: colors.cyan,
    defaultPort: 3000,
    portRange: [3000, 3010], // Try ports 3000-3010
    readyMessage: 'ready in'
  }
];

// Keep track of spawned processes
const processes = [];
let isShuttingDown = false;

// Utility function to check if a port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    import('net').then(({ default: net }) => {
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true); // Port is in use
        } else {
          resolve(false);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve(false); // Port is free
      });
      
      server.listen(port);
    });
  });
}

// Find available port in range
async function findAvailablePort(startPort, endPort) {
  for (let port = startPort; port <= endPort; port++) {
    const isInUse = await checkPort(port);
    if (!isInUse) {
      return port;
    }
  }
  return null; // No available port found
}

// Log with color and prefix
function log(service, message, isError = false) {
  const color = isError ? colors.red : service.color;
  const prefix = `${color}[${service.name}]${colors.reset}`;
  console.log(`${prefix} ${message}`);
}

// Start a service with dynamic port allocation
async function startService(service) {
  // Find available port
  const availablePort = await findAvailablePort(service.portRange[0], service.portRange[1]);
  
  if (!availablePort) {
    log(service, `No available ports in range ${service.portRange[0]}-${service.portRange[1]}. Skipping...`, true);
    return null;
  }

  // Update service port and args if needed
  const actualPort = availablePort;
  let args = [...service.args];
  
  // For frontend, update the port in the npm command
  if (service.name === 'Frontend') {
    args = ['run', 'dev:frontend', '--', '--port', actualPort.toString()];
  }
  
  // For backend, we'll need to pass the port via environment variable
  if (service.name === 'Backend') {
    process.env.PORT = actualPort.toString();
  }
  
  // For RAG server, we'll need to pass the port via environment variable
  if (service.name === 'RAG Server') {
    process.env.RAG_PORT = actualPort.toString();
  }

  log(service, `Starting on port ${actualPort} (originally ${service.defaultPort})...`);
  
  const isWindows = process.platform === 'win32';
  const command = isWindows && service.command === 'npm' ? 'npm.cmd' : service.command;
  
  const proc = spawn(command, args, {
    cwd: service.cwd,
    shell: isWindows,
    env: { 
      ...process.env,
      PORT: actualPort.toString(),
      RAG_PORT: actualPort.toString()
    }
  });

  // Handle stdout
  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        log(service, line);
      });
      
      // Check if service is ready
      if (service.readyMessage && output.includes(service.readyMessage)) {
        log(service, `✅ Ready on port ${actualPort}!`);
      }
    }
  });

  // Handle stderr
  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      output.split('\n').forEach(line => {
        // Python and some tools output normal messages to stderr
        const isError = !line.includes('INFO') && !line.includes('WARNING');
        log(service, line, isError);
      });
    }
  });

  // Handle process exit
  proc.on('exit', (code) => {
    if (!isShuttingDown) {
      log(service, `Process exited with code ${code}`, code !== 0);
      
      // Remove from processes array
      const index = processes.findIndex(p => p.proc === proc);
      if (index > -1) {
        processes.splice(index, 1);
      }
      
      // Restart if it crashed
      if (code !== 0 && !isShuttingDown) {
        log(service, 'Restarting in 5 seconds...');
        setTimeout(() => {
          if (!isShuttingDown) {
            startService(service);
          }
        }, 5000);
      }
    }
  });

  proc.on('error', (err) => {
    log(service, `Failed to start: ${err.message}`, true);
  });

  processes.push({ service, proc, port: actualPort });
  return proc;
}

// Graceful shutdown
function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n${colors.bright}Shutting down all services...${colors.reset}`);
  
  processes.forEach(({ service, proc }) => {
    log(service, 'Stopping...');
    
    // On Windows, we need to kill the process tree
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { shell: true });
    } else {
      proc.kill('SIGTERM');
    }
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log(`${colors.red}Force exiting...${colors.reset}`);
    process.exit(0);
  }, 5000);
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);

// Windows specific handling
if (process.platform === 'win32') {
  import('readline').then(({ default: readline }) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.on('SIGINT', () => {
      process.emit('SIGINT');
    });
  });
}

// Pre-flight checks
async function runPreflightChecks() {
  console.log(`${colors.cyan}Running pre-flight checks...${colors.reset}\n`);
  
  let hasErrors = false;
  
  // Check required environment variables
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`${colors.red}❌ Missing required environment variables:${colors.reset}`);
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.log(`\n${colors.yellow}Please add these to your .env file:${colors.reset}`);
    console.log(`   1. Copy .env.example to .env`);
    console.log(`   2. Fill in your Supabase credentials`);
    console.log(`   3. Run 'npm run check:env' for detailed help\n`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}✅ Environment variables configured${colors.reset}`);
  }
  
  // Check Python installation
  const pythonInstalled = await checkPythonInstallation();
  if (!pythonInstalled) {
    console.error(`${colors.red}❌ Python not found${colors.reset}`);
    console.log(`   Python is required for the RAG server`);
    console.log(`   Install Python 3.x from https://python.org\n`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}✅ Python is installed${colors.reset}`);
  }
  
  // Check if ports are available (just check default ports for info)
  console.log(`\n${colors.cyan}Checking default port availability...${colors.reset}`);
  for (const service of services) {
    const portAvailable = await checkPort(service.defaultPort);
    if (!portAvailable) {
      console.log(`${colors.yellow}⚠️  Port ${service.defaultPort} is in use (${service.name}) - will find alternative${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Port ${service.defaultPort} is available (${service.name})${colors.reset}`);
    }
  }
  
  if (hasErrors) {
    console.log(`\n${colors.red}Pre-flight checks failed!${colors.reset}`);
    console.log(`Fix the issues above and try again.`);
    console.log(`\n${colors.cyan}For detailed diagnostics, run:${colors.reset}`);
    console.log(`   npm run verify\n`);
    return false;
  }
  
  console.log(`\n${colors.green}✅ All pre-flight checks passed!${colors.reset}\n`);
  return true;
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
  });
}

// Main function
async function main() {
  console.log(`${colors.bright}🚀 Starting MedDoc AI Flow Services${colors.reset}\n`);
  
  // Check environment
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}❌ .env file not found!${colors.reset}`);
    console.log('Please create a .env file with the required configuration.');
    console.log(`\n${colors.cyan}Quick setup:${colors.reset}`);
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Add your Supabase credentials');
    console.log('   3. Run this command again\n');
    process.exit(1);
  }
  
  // Run pre-flight checks
  const checksOk = await runPreflightChecks();
  if (!checksOk) {
    process.exit(1);
  }
  
  // Start services with delay between each
  console.log(`${colors.bright}Starting services...${colors.reset}\n`);
  
  for (const service of services) {
    await startService(service);
    
    // Wait a bit between starting services
    if (service !== services[services.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n${colors.bright}✨ All services starting...${colors.reset}`);
  console.log(`\n${colors.dim}Press Ctrl+C to stop all services${colors.reset}\n`);
  
  // Show URLs after a delay
  setTimeout(() => {
    console.log(`\n${colors.bright}📍 Service URLs:${colors.reset}`);
    
    // Get actual ports from running processes
    const frontendProcess = processes.find(p => p.service.name === 'Frontend');
    const backendProcess = processes.find(p => p.service.name === 'Backend');
    const ragProcess = processes.find(p => p.service.name === 'RAG Server');
    
    const frontendPort = frontendProcess?.port || 3000;
    const backendPort = backendProcess?.port || 8081;
    const ragPort = ragProcess?.port || 5001;
    
    console.log(`   ${colors.cyan}Frontend:${colors.reset} http://localhost:${frontendPort}`);
    console.log(`   ${colors.cyan}AI Chat:${colors.reset}  http://localhost:${frontendPort}/ai-chat`);
    console.log(`   ${colors.green}Backend:${colors.reset}  http://localhost:${backendPort}/health`);
    console.log(`   ${colors.yellow}RAG API:${colors.reset}  http://localhost:${ragPort}/health`);
    console.log(`   ${colors.blue}Test Page:${colors.reset} Open file:///${path.join(__dirname, 'test-connection.html')}\n`);
    
    console.log(`${colors.yellow}📝 Troubleshooting:${colors.reset}`);
    console.log(`   - Check service status: npm run verify`);
    console.log(`   - Check environment: npm run check:env`);
    console.log(`   - View diagnostic info: http://localhost:${backendPort}/api/diagnostic\n`);
  }, 5000);
}

// Run the main function
main().catch(err => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, err);
  process.exit(1);
});