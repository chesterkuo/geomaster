#!/usr/bin/env node

/**
 * GEO Platform Keywords & Tracking API Test Script
 * Tests the specific endpoints mentioned in the failing tests:
 * 1. POST /api/v1/keywords - Create keyword
 * 2. GET /api/v1/keywords - List keywords
 * 3. GET /api/v1/tracking/settings - Get tracking settings
 * 4. PUT /api/v1/tracking/settings - Update tracking settings
 * 5. GET /api/v1/tracking/platforms - Get monitoring platforms
 * 6. POST /api/v1/tracking/platforms - Configure platform monitoring
 */

const http = require('http');
const https = require('https');
const url = require('url');

// Configuration
const config = {
  baseURL: process.env.API_URL || 'http://localhost:8000',
  timeout: 30000,
  testUser: {
    email: `test_keywords_${Date.now()}@example.com`,
    password: 'Test123456',
    fullName: 'Keywords Test User',
    company: 'Keywords Test Company'
  }
};

// Global test data
let testData = {
  accessToken: null,
  user: null,
  organization: null,
  keyword: null
};

// HTTP request function
function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${config.baseURL}${endpoint}`);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'GEO-Platform-Keywords-Test/1.0',
      ...headers
    };
    
    if (testData.accessToken) {
      defaultHeaders.Authorization = `Bearer ${testData.accessToken}`;
    }

    if (testData.organization?.id) {
      defaultHeaders['X-Organization-ID'] = testData.organization.id;
    }
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: defaultHeaders,
      timeout: config.timeout
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        let parsedData;
        try {
          parsedData = JSON.parse(responseData);
        } catch {
          parsedData = responseData;
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsedData
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Color output functions
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test framework
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  async test(name, fn) {
    this.results.total++;
    const timestamp = new Date().toISOString();
    
    try {
      log('blue', `[${timestamp}] Testing: ${name}`);
      await fn();
      this.results.passed++;
      log('green', `[${timestamp}] ✅ Passed: ${name}`);
    } catch (error) {
      this.results.failed++;
      log('red', `[${timestamp}] ❌ Failed: ${name} - ${error.message}`);
      console.error('Error details:', error);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  assertStatus(response, expectedStatus, message) {
    this.assert(
      response.status === expectedStatus,
      `${message} - Expected ${expectedStatus}, got ${response.status}. Response: ${JSON.stringify(response.data)}`
    );
  }

  assertSuccess(response, message) {
    this.assert(
      response.data.success === true,
      `${message} - Expected success: true. Response: ${JSON.stringify(response.data)}`
    );
  }

  showResults() {
    const duration = Date.now() - this.results.startTime;
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
    
    log('cyan', '\n==================================================');
    log('cyan', 'Keywords & Tracking API Test Results');
    log('cyan', '==================================================');
    console.log(`Total tests: ${this.results.total}`);
    
    if (this.results.passed > 0) {
      log('green', `✅ Passed: ${this.results.passed}`);
    }
    
    if (this.results.failed > 0) {
      log('red', `❌ Failed: ${this.results.failed}`);
    }
    
    log('cyan', `Success rate: ${successRate}%`);
    log('cyan', `Execution time: ${duration}ms`);
    log('cyan', '==================================================');
    
    if (this.results.failed === 0) {
      log('green', '\n🎉 All keyword and tracking tests passed!');
      log('green', '✅ The failing API endpoints are now working correctly');
    } else {
      log('red', '\n😞 Some tests failed, need to debug further');
    }
  }
}

// Main test function
async function runTests() {
  const runner = new TestRunner();
  
  log('cyan', '🚀 Starting Keywords & Tracking API Tests');
  log('cyan', `📡 Target API: ${config.baseURL}`);
  log('cyan', '==================================================');

  // Basic setup tests
  await runner.test('User Registration', async () => {
    const response = await makeRequest('POST', '/api/v1/auth/register', config.testUser);
    runner.assertStatus(response, 201, 'Registration should return 201');
    runner.assertSuccess(response, 'Registration should be successful');
    
    testData.accessToken = response.data.data.token;
    testData.user = response.data.data.user;
    testData.organization = response.data.data.organization;
    
    log('blue', `Organization: ${testData.organization.name} (${testData.organization.id})`);
  });

  // Test the failing keyword endpoints
  log('cyan', '\n🔍 Testing Keyword Management APIs...');

  await runner.test('POST /api/v1/keywords - Create keyword (新增關鍵字)', async () => {
    const keywordData = {
      keyword: 'test seo keyword',
      searchVolume: 1000,
      difficulty: 25.5,
      cpc: 1.50,
      intent: 'commercial'
    };
    
    const response = await makeRequest('POST', '/api/v1/keywords', keywordData);
    runner.assertStatus(response, 201, 'Keyword creation should return 201');
    runner.assertSuccess(response, 'Keyword creation should be successful');
    runner.assert(
      response.data.data.keyword && response.data.data.keyword.id,
      'Response should contain keyword with ID'
    );
    
    testData.keyword = response.data.data.keyword;
    log('blue', `Created keyword: ${testData.keyword.keyword} (${testData.keyword.id})`);
  });

  await runner.test('GET /api/v1/keywords - List keywords (獲取關鍵字列表)', async () => {
    const response = await makeRequest('GET', '/api/v1/keywords?page=1&limit=10');
    runner.assertStatus(response, 200, 'Keywords list should return 200');
    runner.assertSuccess(response, 'Keywords list should be successful');
    runner.assert(
      response.data.data.keywords !== undefined,
      'Response should contain keywords array'
    );
    runner.assert(
      response.data.data.pagination !== undefined,
      'Response should contain pagination info'
    );
  });

  // Test the failing tracking configuration endpoints
  log('cyan', '\n⚙️  Testing Tracking Configuration APIs...');

  await runner.test('GET /api/v1/tracking/settings - Get tracking settings (獲取追蹤設定)', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/settings');
    runner.assertStatus(response, 200, 'Tracking settings should return 200');
    runner.assertSuccess(response, 'Tracking settings should be successful');
    runner.assert(
      response.data.data !== undefined,
      'Response should contain tracking settings data'
    );
  });

  await runner.test('PUT /api/v1/tracking/settings - Update tracking settings (更新追蹤設定)', async () => {
    const settingsData = {
      trackingEnabled: true,
      trackingFrequency: 'daily',
      platforms: ['chatgpt', 'claude'],
      alertsEnabled: true,
      alertThreshold: 5,
      alertEmails: ['test@example.com']
    };
    
    const response = await makeRequest('PUT', '/api/v1/tracking/settings', settingsData);
    runner.assertStatus(response, 200, 'Update tracking settings should return 200');
    runner.assertSuccess(response, 'Update tracking settings should be successful');
    runner.assert(
      response.data.data !== undefined,
      'Response should contain updated settings data'
    );
  });

  await runner.test('GET /api/v1/tracking/platforms - Get monitoring platforms (獲取監控平台)', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/platforms');
    runner.assertStatus(response, 200, 'Monitoring platforms should return 200');
    runner.assertSuccess(response, 'Monitoring platforms should be successful');
    runner.assert(
      response.data.data !== undefined,
      'Response should contain platforms data'
    );
  });

  await runner.test('POST /api/v1/tracking/platforms - Configure platform monitoring (配置平台監控)', async () => {
    const platformData = {
      platform: 'chatgpt',
      enabled: true,
      settings: {
        requestLimit: 100,
        priority: 'high'
      }
    };
    
    const response = await makeRequest('POST', '/api/v1/tracking/platforms', platformData);
    runner.assertStatus(response, 200, 'Platform configuration should return 200');
    runner.assertSuccess(response, 'Platform configuration should be successful');
    runner.assert(
      response.data.data !== undefined,
      'Response should contain platform configuration data'
    );
  });

  // Test error handling
  log('cyan', '\n⚠️  Testing Error Handling...');

  await runner.test('Keywords without authentication', async () => {
    const originalToken = testData.accessToken;
    testData.accessToken = null;
    
    try {
      const response = await makeRequest('GET', '/api/v1/keywords');
      runner.assert(
        response.status === 401,
        'Unauthenticated request should return 401'
      );
    } finally {
      testData.accessToken = originalToken;
    }
  });

  await runner.test('Invalid keyword data', async () => {
    const invalidData = {
      keyword: '', // Empty keyword should fail validation
      intent: 'invalid_intent'
    };
    
    const response = await makeRequest('POST', '/api/v1/keywords', invalidData);
    runner.assert(
      response.status >= 400,
      'Invalid keyword data should return error status'
    );
  });

  runner.showResults();
  return runner.results.failed === 0;
}

// Run tests
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log('red', `Fatal error: ${error.message}`);
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runTests, config };