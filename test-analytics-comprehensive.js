#!/usr/bin/env node

/**
 * GEO Platform Phase 2.2 Analytics & Competitor Benchmarking API 測試腳本
 * 測試全新的分析和競爭對手基準測試功能
 * 
 * 使用方法:
 * node test-analytics-comprehensive.js
 * 或: npm run test:api:analytics
 */

const http = require('http');
const https = require('https');
const url = require('url');

// 配置
const config = {
  baseURL: process.env.API_URL || 'https://api-geo.blitzgame.site',
  timeout: 30000,
  testUser: {
    email: `test_analytics_${Date.now()}@example.com`,
    password: 'Test123456',
    fullName: 'Analytics Test User',
    company: 'Analytics Test Company'
  }
};

// 全局變數
let testData = {
  accessToken: null,
  user: null,
  organization: null,
  website: null
};

// 簡單的 HTTP 請求函數
function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${config.baseURL}${endpoint}`);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'GEO-Platform-Analytics-Test/1.0',
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

// 顏色輸出函數
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

// 測試框架
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
      log('blue', `[${timestamp}] ℹ️  Testing: ${name}`);
      await fn();
      this.results.passed++;
      log('green', `[${timestamp}] ✅ Passed: ${name}`);
    } catch (error) {
      this.results.failed++;
      log('red', `[${timestamp}] ❌ Failed: ${name} - ${error.message}`);
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
      `${message} - Expected ${expectedStatus}, got ${response.status}`
    );
  }

  assertSuccess(response, message) {
    this.assert(
      response.data.success === true,
      `${message} - Expected success: true`
    );
  }

  showResults() {
    const duration = Date.now() - this.results.startTime;
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(2);
    
    log('cyan', '\n==================================================');
    log('cyan', 'Test Results Summary');
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
      log('green', '\n🎉 All analytics tests passed!');
      log('green', '✅ Phase 2.2 Advanced Analytics & Competitor Benchmarking is working');
    } else {
      log('red', '\n😞 Some analytics tests failed, please check server status');
    }
  }
}

// 主要測試函數
async function runTests() {
  const runner = new TestRunner();
  
  log('cyan', '🚀 Starting GEO Platform Phase 2.2 Analytics & Competitor Benchmarking Tests');
  log('cyan', `📡 Target API: ${config.baseURL}`);
  log('cyan', '==================================================');

  // 基礎設置測試
  await runner.test('User Registration', async () => {
    const response = await makeRequest('POST', '/api/v1/auth/register', config.testUser);
    runner.assertStatus(response, 201, 'Registration should return 201');
    runner.assertSuccess(response, 'Registration should be successful');
    
    testData.accessToken = response.data.data.token;
    testData.user = response.data.data.user;
    testData.organization = response.data.data.organization;
    
    log('blue', `🏢 Organization: ${testData.organization.name} (${testData.organization.id})`);
  });

  await runner.test('Create Test Website', async () => {
    const websiteData = {
      url: 'https://example.com',
      name: 'Test Analytics Website',
      description: 'Test website for analytics testing'
    };
    
    const response = await makeRequest('POST', '/api/v1/websites', websiteData);
    runner.assertStatus(response, 201, 'Website creation should return 201');
    runner.assertSuccess(response, 'Website creation should be successful');
    
    testData.website = response.data.data.website;
    log('blue', `🌐 Website: ${testData.website.name} (${testData.website.id})`);
  });

  // Phase 2.2 Analytics API 測試
  log('cyan', '\n📊 Testing Analytics APIs...');

  await runner.test('GET /analytics/dashboard/:websiteId - Get analytics dashboard', async () => {
    const response = await makeRequest('GET', `/api/v1/analytics/dashboard/${testData.website.id}`);
    runner.assertStatus(response, 200, 'Analytics dashboard should return 200');
    runner.assertSuccess(response, 'Analytics dashboard should be successful');
    runner.assert(
      response.data.data.snapshot || response.data.data.lastUpdated !== undefined,
      'Dashboard should contain analytics data'
    );
  });

  await runner.test('GET /analytics/trends/:websiteId - Get analytics trends', async () => {
    const response = await makeRequest('GET', `/api/v1/analytics/trends/${testData.website.id}?days=30`);
    runner.assertStatus(response, 200, 'Analytics trends should return 200');
    runner.assertSuccess(response, 'Analytics trends should be successful');
    runner.assert(
      response.data.data.trends !== undefined && response.data.data.period === '30 days',
      'Trends should contain trend data and period info'
    );
  });

  await runner.test('GET /analytics/platforms/:websiteId - Get platform performance', async () => {
    const response = await makeRequest('GET', `/api/v1/analytics/platforms/${testData.website.id}`);
    runner.assertStatus(response, 200, 'Platform performance should return 200');
    runner.assertSuccess(response, 'Platform performance should be successful');
    runner.assert(
      response.data.data.platforms !== undefined,
      'Platform performance should contain platforms data'
    );
  });

  await runner.test('POST /analytics/snapshot/:websiteId - Generate analytics snapshot', async () => {
    const snapshotData = {
      snapshotType: 'daily'
    };
    
    const response = await makeRequest('POST', `/api/v1/analytics/snapshot/${testData.website.id}`, snapshotData);
    runner.assertStatus(response, 200, 'Snapshot generation should return 200');
    runner.assertSuccess(response, 'Snapshot generation should be successful');
    runner.assert(
      response.data.data.snapshot && response.data.data.message,
      'Snapshot response should contain snapshot data and message'
    );
  });

  await runner.test('GET /analytics/insights/:websiteId - Get performance insights', async () => {
    const response = await makeRequest('GET', `/api/v1/analytics/insights/${testData.website.id}`);
    runner.assertStatus(response, 200, 'Performance insights should return 200');
    runner.assertSuccess(response, 'Performance insights should be successful');
    runner.assert(
      response.data.data.insights !== undefined || response.data.data.recommendations !== undefined,
      'Insights should contain insights or recommendations'
    );
  });

  // Phase 2.2 Competitor Analysis API 測試
  log('cyan', '\n🥊 Testing Competitor Analysis APIs...');

  await runner.test('POST /analytics/competitors/analyze/:websiteId - Analyze competitors', async () => {
    const analysisData = {
      analysisType: 'quick',
      competitorIds: [] // Empty for general analysis
    };
    
    const response = await makeRequest('POST', `/api/v1/analytics/competitors/analyze/${testData.website.id}`, analysisData);
    runner.assertStatus(response, 200, 'Competitor analysis should return 200');
    runner.assertSuccess(response, 'Competitor analysis should be successful');
    runner.assert(
      response.data.data.competitorInsights !== undefined && response.data.data.marketOverview !== undefined,
      'Analysis should contain competitor insights and market overview'
    );
  });

  await runner.test('GET /analytics/competitors/summary - Get competitor summary', async () => {
    const response = await makeRequest('GET', '/api/v1/analytics/competitors/summary');
    runner.assertStatus(response, 200, 'Competitor summary should return 200');
    runner.assertSuccess(response, 'Competitor summary should be successful');
    runner.assert(
      response.data.data.competitors !== undefined,
      'Summary should contain competitors data'
    );
  });

  // 測試錯誤處理和邊界案例
  log('cyan', '\n⚠️  Testing Error Handling...');

  await runner.test('Analytics dashboard - Invalid website ID', async () => {
    const response = await makeRequest('GET', '/api/v1/analytics/dashboard/invalid-website-id');
    runner.assert(
      response.status >= 400,
      'Invalid website ID should return error status'
    );
  });

  await runner.test('Analytics trends - Invalid days parameter', async () => {
    const response = await makeRequest('GET', `/api/v1/analytics/trends/${testData.website.id}?days=invalid`);
    runner.assertStatus(response, 200, 'Should handle invalid days parameter gracefully');
    // Should default to 30 days
  });

  await runner.test('Analytics snapshot - Invalid snapshot type', async () => {
    const invalidData = {
      snapshotType: 'invalid_type'
    };
    
    const response = await makeRequest('POST', `/api/v1/analytics/snapshot/${testData.website.id}`, invalidData);
    runner.assert(
      response.status === 400,
      'Invalid snapshot type should return 400'
    );
    runner.assert(
      response.data.success === false,
      'Invalid request should return success: false'
    );
  });

  await runner.test('Analytics dashboard - Missing website ID', async () => {
    const response = await makeRequest('GET', '/api/v1/analytics/dashboard/');
    runner.assert(
      response.status === 404,
      'Missing website ID should return 404'
    );
  });

  // 測試權限檢查
  log('cyan', '\n🔒 Testing Permission Checks...');

  await runner.test('Analytics without authentication', async () => {
    // 暫時移除認證 token
    const originalToken = testData.accessToken;
    testData.accessToken = null;
    
    try {
      const response = await makeRequest('GET', `/api/v1/analytics/dashboard/${testData.website.id}`);
      runner.assert(
        response.status === 401,
        'Unauthenticated request should return 401'
      );
    } finally {
      testData.accessToken = originalToken;
    }
  });

  await runner.test('Analytics without organization header', async () => {
    // 暫時移除組織 ID
    const originalOrg = testData.organization;
    testData.organization = null;
    
    try {
      const response = await makeRequest('GET', `/api/v1/analytics/dashboard/${testData.website.id}`);
      runner.assert(
        response.status >= 400,
        'Request without organization should return error'
      );
    } finally {
      testData.organization = originalOrg;
    }
  });

  // 測試批量操作（如果有權限）
  log('cyan', '\n📦 Testing Bulk Operations...');

  await runner.test('POST /analytics/snapshots/bulk - Bulk generate snapshots (Admin)', async () => {
    const response = await makeRequest('POST', '/api/v1/analytics/snapshots/bulk');
    // 這個端點可能需要管理員權限，所以我們檢查是否返回合理的響應
    runner.assert(
      response.status === 200 || response.status === 403,
      'Bulk snapshots should return 200 (success) or 403 (forbidden)'
    );
    
    if (response.status === 200) {
      runner.assertSuccess(response, 'Bulk snapshots should be successful');
      runner.assert(
        response.data.data.summary !== undefined,
        'Bulk operation should contain summary'
      );
    }
  });

  // 清理測試資料
  log('cyan', '\n🧹 Cleaning up test data...');

  await runner.test('Delete test website', async () => {
    const response = await makeRequest('DELETE', `/api/v1/websites/${testData.website.id}`);
    runner.assertStatus(response, 200, 'Website deletion should return 200');
    runner.assertSuccess(response, 'Website deletion should be successful');
  });

  runner.showResults();
  return runner.results.failed === 0;
}

// 執行測試
if (require.main === module) {
  runTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log('red', `Fatal error: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runTests, config };