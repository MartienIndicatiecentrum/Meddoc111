// test-services.js - Test all services
import { spawn } from 'child_process';
import net from 'net';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  return new Promise(resolve => {
    const server = net.createServer();

    server.once('error', err => {
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

// Test service health
async function testServiceHealth(url, name) {
  try {
    const http = await import('http');
    const response = await new Promise((resolve, reject) => {
      http
        .get(url, res => {
          resolve(res.statusCode === 200);
        })
        .on('error', () => {
          resolve(false);
        });
    });

    if (response) {
      console.log(`${colors.green}✅${colors.reset} ${name} is healthy`);
      return true;
    } else {
      console.log(`${colors.red}❌${colors.reset} ${name} is not responding`);
      return false;
    }
  } catch (error) {
    console.log(
      `${colors.red}❌${colors.reset} ${name} error: ${error.message}`
    );
    return false;
  }
}

// Check Python installation
function checkPythonInstallation() {
  return new Promise(resolve => {
    const python = spawn('python', ['--version']);

    python.on('error', () => {
      resolve(false);
    });

    python.stdout.on('data', () => {
      resolve(true);
    });

    python.stderr.on('data', data => {
      // Python sometimes outputs version to stderr
      if (data.toString().includes('Python')) {
        resolve(true);
      }
    });

    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
}

async function main() {
  console.log(
    `${colors.bright}🔍 Testing MedDoc AI Flow Services${colors.reset}\n`
  );

  // Check environment
  console.log(`${colors.cyan}Environment Check:${colors.reset}`);
  const envPath = `${__dirname}/.env`;
  const fs = await import('fs');

  if (!fs.existsSync(envPath)) {
    console.log(`${colors.red}❌ .env file not found${colors.reset}`);
    console.log(
      '   Please copy env.example to .env and configure your credentials'
    );
  } else {
    console.log(`${colors.green}✅ .env file exists${colors.reset}`);
  }

  // Check required environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.log(
      `${colors.red}❌ Missing environment variables: ${missingVars.join(', ')}${colors.reset}`
    );
  } else {
    console.log(
      `${colors.green}✅ All required environment variables are set${colors.reset}`
    );
  }

  // Check Python
  console.log(`\n${colors.cyan}Python Check:${colors.reset}`);
  const pythonAvailable = await checkPythonInstallation();
  if (pythonAvailable) {
    console.log(`${colors.green}✅ Python is installed${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Python not found${colors.reset}`);
    console.log('   RAG Server requires Python 3.x');
  }

  // Check ports
  console.log(`\n${colors.cyan}Port Availability:${colors.reset}`);
  const ports = [
    { port: 3000, name: 'Frontend' },
    { port: 8081, name: 'Backend' },
    { port: 5001, name: 'RAG Server' },
  ];

  for (const { port, name } of ports) {
    const inUse = await isPortInUse(port);
    if (inUse) {
      console.log(
        `${colors.yellow}⚠️  Port ${port} (${name}) is in use${colors.reset}`
      );
    } else {
      console.log(
        `${colors.green}✅ Port ${port} (${name}) is available${colors.reset}`
      );
    }
  }

  // Test service health (if they're running)
  console.log(`\n${colors.cyan}Service Health Check:${colors.reset}`);
  await testServiceHealth('http://localhost:3000', 'Frontend');
  await testServiceHealth('http://localhost:8081/health', 'Backend');
  await testServiceHealth('http://localhost:5001/health', 'RAG Server');

  console.log(`\n${colors.bright}📋 Summary:${colors.reset}`);
  console.log('   To start all services: npm run dev');
  console.log('   To start individually:');
  console.log('     Frontend: npm run dev:frontend');
  console.log('     Backend:  npm run dev:backend');
  console.log('     RAG:      npm run dev:rag');
  console.log('   Or use the simple scripts:');
  console.log('     Windows:  simple-start.bat');
  console.log('     PowerShell: simple-start.ps1');
}

main().catch(err => {
  console.error(`${colors.red}Error:${colors.reset}`, err.message);
  process.exit(1);
});
