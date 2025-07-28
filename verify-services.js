// verify-services.js - Service Verification and Diagnostic Script
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Check results
const results = {
  envFile: false,
  envVars: {},
  ports: {},
  services: {},
  database: false
};

console.log(`${colors.bright}🔍 MedDoc AI Flow - Service Verification${colors.reset}\n`);

// Step 1: Check .env file
function checkEnvFile() {
  console.log(`${colors.cyan}1. Checking environment configuration...${colors.reset}`);
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (fs.existsSync(envPath)) {
    console.log(`${colors.green}✅ .env file found${colors.reset}`);
    results.envFile = true;
  } else {
    console.log(`${colors.red}❌ .env file not found${colors.reset}`);
    if (fs.existsSync(envExamplePath)) {
      console.log(`${colors.yellow}   → Copy .env.example to .env and fill in your values${colors.reset}`);
    }
    return false;
  }
  
  // Check required variables
  const required = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY
  };
  
  const optional = {
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
    'PORT': process.env.PORT || '8081',
    'DEBUG': process.env.DEBUG || 'false'
  };
  
  let hasAllRequired = true;
  
  console.log('\n  Required variables:');
  for (const [key, value] of Object.entries(required)) {
    if (value) {
      console.log(`  ${colors.green}✅ ${key}${colors.reset} = ${value.substring(0, 20)}...`);
      results.envVars[key] = true;
    } else {
      console.log(`  ${colors.red}❌ ${key}${colors.reset} = Not set`);
      results.envVars[key] = false;
      hasAllRequired = false;
    }
  }
  
  console.log('\n  Optional variables:');
  for (const [key, value] of Object.entries(optional)) {
    if (value && value !== 'false' && value !== '8081') {
      console.log(`  ${colors.green}✅ ${key}${colors.reset} = ${value}`);
    } else {
      console.log(`  ${colors.yellow}⚠️  ${key}${colors.reset} = ${value || 'Not set'}`);
    }
  }
  
  return hasAllRequired;
}

// Step 2: Check port availability
async function checkPort(port, service) {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        results.ports[port] = 'in-use';
        resolve({ available: false, message: `Port ${port} is already in use` });
      } else {
        results.ports[port] = 'error';
        resolve({ available: false, message: `Error checking port ${port}: ${err.message}` });
      }
    });
    
    server.once('listening', () => {
      server.close();
      results.ports[port] = 'available';
      resolve({ available: true, message: `Port ${port} is available` });
    });
    
    server.listen(port);
  });
}

async function checkPorts() {
  console.log(`\n${colors.cyan}2. Checking port availability...${colors.reset}`);
  
  const ports = [
    { port: 3000, service: 'Frontend (Vite)' },
    { port: 8081, service: 'Backend (Node.js)' },
    { port: 5000, service: 'RAG Server (Python)' }
  ];
  
  for (const { port, service } of ports) {
    const result = await checkPort(port);
    if (result.available) {
      console.log(`  ${colors.green}✅ Port ${port}${colors.reset} - ${service} - Available`);
    } else {
      console.log(`  ${colors.red}❌ Port ${port}${colors.reset} - ${service} - ${result.message}`);
    }
  }
}

// Step 3: Test service endpoints
async function testEndpoint(url, service) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ success: false, message: 'Timeout - Service not responding' });
    }, 5000);
    
    http.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, message: 'Service is running', data });
        } else {
          resolve({ success: false, message: `HTTP ${res.statusCode}`, data });
        }
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      resolve({ success: false, message: err.message });
    });
  });
}

async function checkRunningServices() {
  console.log(`\n${colors.cyan}3. Testing running services...${colors.reset}`);
  
  // Test backend
  console.log('\n  Backend Service:');
  const backendResult = await testEndpoint('http://localhost:8081/health', 'Backend');
  if (backendResult.success) {
    console.log(`  ${colors.green}✅ Backend is running${colors.reset}`);
    results.services.backend = true;
    
    // Try to parse health data
    try {
      const health = JSON.parse(backendResult.data);
      if (health.database === 'connected') {
        console.log(`  ${colors.green}✅ Database is connected${colors.reset}`);
        results.database = true;
      } else {
        console.log(`  ${colors.red}❌ Database is not connected${colors.reset}`);
      }
    } catch (e) {
      console.log(`  ${colors.yellow}⚠️  Could not parse health data${colors.reset}`);
    }
  } else {
    console.log(`  ${colors.red}❌ Backend is not running${colors.reset} - ${backendResult.message}`);
    results.services.backend = false;
  }
  
  // Test RAG server
  console.log('\n  RAG Server:');
  const ragResult = await testEndpoint('http://localhost:5001/health', 'RAG Server');
  if (ragResult.success) {
    console.log(`  ${colors.green}✅ RAG Server is running${colors.reset}`);
    results.services.rag = true;
  } else {
    console.log(`  ${colors.yellow}⚠️  RAG Server is not running${colors.reset} - ${ragResult.message}`);
    results.services.rag = false;
  }
  
  // Test frontend
  console.log('\n  Frontend:');
  const frontendResult = await testEndpoint('http://localhost:3000', 'Frontend');
  if (frontendResult.success) {
    console.log(`  ${colors.green}✅ Frontend is running${colors.reset}`);
    results.services.frontend = true;
  } else {
    console.log(`  ${colors.yellow}⚠️  Frontend is not running${colors.reset} - ${frontendResult.message}`);
    results.services.frontend = false;
  }
}

// Step 4: Test Python installation
async function checkPython() {
  console.log(`\n${colors.cyan}4. Checking Python installation...${colors.reset}`);
  
  return new Promise((resolve) => {
    const python = spawn('python', ['--version']);
    
    python.stdout.on('data', (data) => {
      console.log(`  ${colors.green}✅ Python installed:${colors.reset} ${data.toString().trim()}`);
      resolve(true);
    });
    
    python.stderr.on('data', (data) => {
      const version = data.toString().trim();
      if (version.includes('Python')) {
        console.log(`  ${colors.green}✅ Python installed:${colors.reset} ${version}`);
        resolve(true);
      } else {
        console.log(`  ${colors.red}❌ Python error:${colors.reset} ${version}`);
        resolve(false);
      }
    });
    
    python.on('error', (err) => {
      console.log(`  ${colors.red}❌ Python not found${colors.reset} - Please install Python 3.x`);
      resolve(false);
    });
  });
}

// Step 5: Generate recommendations
function generateRecommendations() {
  console.log(`\n${colors.cyan}5. Recommendations:${colors.reset}\n`);
  
  const issues = [];
  
  // Check environment
  if (!results.envFile) {
    issues.push({
      severity: 'critical',
      message: 'Create .env file',
      solution: 'cp .env.example .env && edit .env'
    });
  } else if (!results.envVars.SUPABASE_URL || !results.envVars.SUPABASE_SERVICE_ROLE_KEY) {
    issues.push({
      severity: 'critical',
      message: 'Configure Supabase credentials in .env',
      solution: 'Edit .env and add your Supabase URL and service role key'
    });
  }
  
  // Check services
  if (!results.services.backend) {
    if (results.ports[8081] === 'in-use') {
      issues.push({
        severity: 'warning',
        message: 'Port 8081 is in use but backend health check failed',
        solution: 'Check if another application is using port 8081'
      });
    } else {
      issues.push({
        severity: 'high',
        message: 'Backend server is not running',
        solution: 'Run: node server.js'
      });
    }
  }
  
  if (!results.services.rag) {
    issues.push({
      severity: 'medium',
      message: 'RAG server is not running (required for document upload)',
      solution: 'Run: python advanced_rag_server.py'
    });
  }
  
  if (!results.services.frontend) {
    issues.push({
      severity: 'high',
      message: 'Frontend is not running',
      solution: 'Run: npm run dev:frontend'
    });
  }
  
  // Display issues
  if (issues.length === 0) {
    console.log(`${colors.green}✅ All systems operational!${colors.reset}`);
    console.log('\nYou can access the AI Chat at: http://localhost:3000/ai-chat');
  } else {
    issues.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, warning: 3 };
      return priority[a.severity] - priority[b.severity];
    });
    
    console.log('Issues found:\n');
    issues.forEach((issue, index) => {
      const severityColor = {
        critical: colors.red,
        high: colors.red,
        medium: colors.yellow,
        warning: colors.yellow
      };
      
      console.log(`${index + 1}. ${severityColor[issue.severity]}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.message}`);
      console.log(`   → ${colors.cyan}Solution:${colors.reset} ${issue.solution}\n`);
    });
    
    console.log(`${colors.bright}Quick Start Commands:${colors.reset}`);
    console.log('1. Fix environment: npm run check:env');
    console.log('2. Start all services: npm run dev');
    console.log('3. Or start individually:');
    console.log('   - Backend: node server.js');
    console.log('   - RAG: python advanced_rag_server.py');
    console.log('   - Frontend: npm run dev:frontend');
  }
}

// Main execution
async function main() {
  const envOk = checkEnvFile();
  await checkPorts();
  await checkRunningServices();
  await checkPython();
  generateRecommendations();
  
  // Save results for other scripts
  fs.writeFileSync(
    path.join(__dirname, '.service-check-results.json'),
    JSON.stringify(results, null, 2)
  );
}

main().catch(err => {
  console.error(`${colors.red}Verification error:${colors.reset}`, err);
  process.exit(1);
});