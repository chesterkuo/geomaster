#!/usr/bin/env node

/**
 * Test only the alert dashboard endpoint
 */

const http = require('http');

// Configuration
const config = {
  baseURL: 'http://localhost:8000',
  testUser: {
    email: `alert_dashboard_${Date.now()}@example.com`,
    password: 'Test123456',
    fullName: 'Alert Dashboard Test',
    company: 'Alert Dashboard Company'
  }
};

// Test data storage
let testData = {
  accessToken: null,
  organization: null
};

// Simple HTTP request function
function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${config.baseURL}${endpoint}`);
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Alert-Dashboard-Test/1.0',
      ...headers
    };
    
    if (testData.accessToken) {
      defaultHeaders.Authorization = `Bearer ${testData.accessToken}`;
    }
    
    if (testData.organization?.id) {
      defaultHeaders['X-Organization-ID'] = testData.organization.id;
    }
    
    const requestBody = data ? JSON.stringify(data) : null;
    if (requestBody) {
      defaultHeaders['Content-Length'] = Buffer.byteLength(requestBody);
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 8000,
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: defaultHeaders,
      timeout: 10000
    };
    
    const req = http.request(options, (res) => {
      let responseBody = '';
      
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseBody);
          resolve({
            status: res.statusCode,
            data: jsonResponse
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseBody
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (requestBody) {
      req.write(requestBody);
    }
    
    req.end();
  });
}

async function testAlertDashboard() {
  console.log('🚀 Testing Alert Dashboard Only');
  console.log('==================================================');
  
  try {
    // 1. Register user
    console.log('📝 Registering test user...');
    const registerResponse = await makeRequest('POST', '/api/v1/auth/register', config.testUser);
    
    if (registerResponse.status !== 201) {
      console.error('Registration failed:', registerResponse.status, registerResponse.data);
      return 'failed';
    }
    
    testData.accessToken = registerResponse.data.data.token;
    testData.organization = registerResponse.data.data.organization;
    console.log('✅ User registered and authenticated');
    console.log(`🏢 Organization: ${testData.organization?.name} (${testData.organization?.id})`);
    
    // 2. Test Alert Dashboard
    console.log('\n📊 Testing alert dashboard...');
    console.log(`Request headers will be:`);
    console.log(`  Authorization: Bearer ${testData.accessToken}`);
    console.log(`  X-Organization-ID: ${testData.organization?.id}`);
    
    const dashboardResponse = await makeRequest('GET', '/api/v1/alerts/dashboard');
    
    console.log(`Dashboard response status: ${dashboardResponse.status}`);
    console.log(`Dashboard response data:`, JSON.stringify(dashboardResponse.data, null, 2));
    
    if (dashboardResponse.status !== 200) {
      throw new Error(`Dashboard test failed: ${dashboardResponse.status} - ${JSON.stringify(dashboardResponse.data)}`);
    }
    
    console.log('✅ Alert dashboard accessible');
    console.log(`   Total Alerts: ${dashboardResponse.data.data?.totalAlerts || 0}`);
    console.log(`   Active Alerts: ${dashboardResponse.data.data?.activeAlerts || 0}`);
    
    return 'success';
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return 'failed';
  }
}

// Run the test
testAlertDashboard().then((result) => {
  console.log('\n==================================================');
  console.log('🧪 Alert Dashboard Test Results');
  console.log('==================================================');
  
  switch (result) {
    case 'success':
      console.log('🎉 Alert dashboard test passed!');
      console.log('✅ Authentication is working');
      console.log('✅ Alert endpoints are accessible');
      process.exit(0);
      break;
      
    default:
      console.log('❌ Alert dashboard test failed');
      console.log('🔧 Check server logs for details');
      process.exit(1);
  }
}).catch((error) => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});