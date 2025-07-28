// Test backend connection
const fetch = require('node-fetch');

async function testBackend() {
  try {
    // Test health endpoint
    console.log('Testing backend health endpoint...');
    const healthResponse = await fetch('http://localhost:8081/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend is running!');
      console.log('Health data:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('❌ Backend health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.error('❌ Cannot connect to backend:', error.message);
    console.log('\nPlease make sure the backend is running:');
    console.log('1. Open a new terminal');
    console.log('2. Run the backend server: node server.js');
    console.log('3. Install dependencies: npm install');
    console.log('4. Start the server: node server.js');
  }
}

testBackend();