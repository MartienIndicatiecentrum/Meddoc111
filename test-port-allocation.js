#!/usr/bin/env node

// Utility function to check if a port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
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

async function testPortAllocation() {
  console.log('🧪 Testing dynamic port allocation...\n');

  // Test individual port checking
  console.log('Testing port availability:');
  const ports = [3000, 3001, 3002, 8081, 8082, 5001, 5002];

  for (const port of ports) {
    const isInUse = await checkPort(port);
    console.log(`  Port ${port}: ${isInUse ? '❌ In use' : '✅ Available'}`);
  }

  console.log('\nTesting port range finding:');

  // Test finding available port in range
  const ranges = [
    { name: 'Frontend', range: [3000, 3010] },
    { name: 'Backend', range: [8081, 8090] },
    { name: 'RAG', range: [5001, 5010] }
  ];

  for (const { name, range } of ranges) {
    const availablePort = await findAvailablePort(range[0], range[1]);
    if (availablePort) {
      console.log(`  ${name}: ✅ Found available port ${availablePort} in range ${range[0]}-${range[1]}`);
    } else {
      console.log(`  ${name}: ❌ No available ports in range ${range[0]}-${range[1]}`);
    }
  }

  console.log('\n✅ Port allocation test completed!');
}

// Run test if called directly
if (require.main === module) {
  testPortAllocation().catch(console.error);
}