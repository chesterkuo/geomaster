#!/usr/bin/env node

/**
 * GEO Platform API 簡單測試腳本
 * 不需要額外依賴，驗證後端 API 基本功能
 * 
 * 使用方法:
 * node test-api-simple.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

// 配置
const config = {
  baseURL: process.env.API_URL || 'http://localhost:8000',
  timeout: 30000,
  testUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!',
    fullName: '測試用戶',
    company: '測試公司'
  }
};

// 全局變數
let testData = {
  accessToken: null,
  user: null,
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
      'User-Agent': 'GEO-Platform-API-Test/1.0',
      ...headers
    };
    
    if (testData.accessToken) {
      defaultHeaders.Authorization = `Bearer ${testData.accessToken}`;
    }
    
    const requestData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method.toUpperCase(),
      headers: defaultHeaders,
      timeout: config.timeout
    };
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('請求超時')));
    
    if (requestData) {
      req.write(requestData);
    }
    
    req.end();
  });
}

// 日誌函數
function log(message, type = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // 青色
    SUCCESS: '\x1b[32m', // 綠色
    ERROR: '\x1b[31m',   // 紅色
    WARNING: '\x1b[33m', // 黃色
    RESET: '\x1b[0m'     // 重置
  };
  
  console.log(`${colors[type] || colors.INFO}[${timestamp}] [${type}] ${message}${colors.RESET}`);
}

// 測試類
class SimpleTestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  async test(name, testFn) {
    try {
      log(`開始測試: ${name}`, 'INFO');
      await testFn();
      this.passed++;
      log(`✅ 測試通過: ${name}`, 'SUCCESS');
    } catch (error) {
      this.failed++;
      log(`❌ 測試失敗: ${name} - ${error.message}`, 'ERROR');
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(`斷言失敗: ${message}`);
    }
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed;
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 測試結果摘要');
    console.log('='.repeat(50));
    console.log(`總測試數: ${total}`);
    console.log(`✅ 通過: ${this.passed}`);
    console.log(`❌ 失敗: ${this.failed}`);
    console.log(`📈 成功率: ${total > 0 ? ((this.passed / total) * 100).toFixed(2) : 0}%`);
    console.log(`⏱️  執行時間: ${duration}ms`);
    console.log('='.repeat(50));
    
    return this.failed === 0;
  }
}

// 測試函數
async function runTests() {
  const runner = new SimpleTestRunner();
  
  console.log('🚀 開始 GEO Platform API 簡單測試');
  console.log(`📡 目標 API: ${config.baseURL}`);
  console.log('='.repeat(50));

  // 健康檢查
  await runner.test('健康檢查', async () => {
    const response = await makeRequest('GET', '/health');
    runner.assert(response.status === 200, '健康檢查應該返回 200 狀態碼');
    runner.assert(response.data.success === true, '健康檢查應該返回 success: true');
    log(`健康檢查通過: ${JSON.stringify(response.data)}`, 'INFO');
  });

  // 用戶註冊
  await runner.test('用戶註冊', async () => {
    const response = await makeRequest('POST', '/api/v1/auth/register', config.testUser);
    
    runner.assert(response.status === 201, `註冊應該返回 201，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '註冊應該返回 success: true');
    runner.assert(response.data.data && response.data.data.user, '註冊應該返回用戶資料');
    runner.assert(response.data.data && response.data.data.token, '註冊應該返回訪問令牌');
    
    // 保存測試資料
    if (response.data.data) {
      testData.accessToken = response.data.data.token;
      testData.user = response.data.data.user;
    }
    
    log(`用戶已註冊: ${config.testUser.email}`, 'INFO');
  });

  // 用戶登入
  await runner.test('用戶登入', async () => {
    const loginData = {
      email: config.testUser.email,
      password: config.testUser.password
    };
    
    const response = await makeRequest('POST', '/api/v1/auth/login', loginData);
    
    runner.assert(response.status === 200, `登入應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '登入應該返回 success: true');
    runner.assert(response.data.data && response.data.data.user, '登入應該返回用戶資料');
    runner.assert(response.data.data && response.data.data.token, '登入應該返回訪問令牌');
    
    // 更新令牌
    if (response.data.data && response.data.data.token) {
      testData.accessToken = response.data.data.token;
    }
    
    log(`用戶已登入: ${config.testUser.email}`, 'INFO');
  });

  // 獲取用戶資料
  await runner.test('獲取用戶資料', async () => {
    const response = await makeRequest('GET', '/api/v1/auth/profile');
    
    runner.assert(response.status === 200, `獲取用戶資料應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '獲取用戶資料應該返回 success: true');
    runner.assert(response.data.data && response.data.data.id, '應該返回用戶資料');
    
    log(`獲取用戶資料成功: ${response.data.data.email || 'N/A'}`, 'INFO');
  });

  // 創建測試網站
  await runner.test('創建網站', async () => {
    const websiteData = {
      url: 'https://example.com',
      name: '測試網站',
      description: '用於 API 測試的網站',
      scanFrequency: 'weekly'
    };
    
    const response = await makeRequest('POST', '/api/v1/websites', websiteData);
    
    runner.assert(response.status === 201, `創建網站應該返回 201，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '創建網站應該返回 success: true');
    runner.assert(response.data.data && response.data.data.url === websiteData.url, '網站 URL 應該匹配');
    
    // 保存網站資料
    if (response.data.data) {
      testData.website = response.data.data;
    }
    
    log(`網站已創建: ${websiteData.name} (${websiteData.url})`, 'INFO');
  });

  // 獲取網站列表
  await runner.test('獲取網站列表', async () => {
    const response = await makeRequest('GET', '/api/v1/websites');
    
    runner.assert(response.status === 200, `獲取網站列表應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '獲取網站列表應該返回 success: true');
    runner.assert(response.data.data && Array.isArray(response.data.data.websites), '網站列表應該是數組');
    runner.assert(response.data.data.websites.length > 0, '網站列表不應該為空');
    
    log(`找到 ${response.data.data.websites.length} 個網站`, 'INFO');
  });

  // API 文檔檢查
  await runner.test('API 文檔可訪問性', async () => {
    const response = await makeRequest('GET', '/api/v1/docs');
    
    runner.assert(response.status === 200 || response.status === 404, 'API 文檔端點應該可訪問');
    
    if (response.status === 200) {
      log('API 文檔可訪問', 'INFO');
    } else {
      log('API 文檔端點不存在（這是預期的）', 'WARNING');
    }
  });

  // 清理測試資料
  if (testData.website && testData.website.id) {
    await runner.test('清理測試網站', async () => {
      const response = await makeRequest('DELETE', `/api/v1/websites/${testData.website.id}`);
      
      runner.assert(
        response.status === 200 || response.status === 204 || response.status === 404, 
        '刪除網站應該返回 200/204/404 狀態碼'
      );
      
      log(`測試網站已清理: ${testData.website.id}`, 'INFO');
    });
  }

  // 顯示結果
  const success = runner.summary();
  
  if (success) {
    log('🎉 所有測試都通過了！', 'SUCCESS');
    process.exit(0);
  } else {
    log('😞 有些測試失敗了，請檢查伺服器狀態', 'ERROR');
    process.exit(1);
  }
}

// 錯誤處理
process.on('uncaughtException', (error) => {
  log(`未捕獲的異常: ${error.message}`, 'ERROR');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`未處理的 Promise 拒絕: ${reason}`, 'ERROR');
  process.exit(1);
});

// 執行測試
if (require.main === module) {
  // 檢查伺服器是否運行
  log('🔍 檢查伺服器狀態...', 'INFO');
  
  makeRequest('GET', '/health')
    .then(() => {
      log('✅ 伺服器正在運行，開始測試', 'SUCCESS');
      return runTests();
    })
    .catch((error) => {
      log('❌ 無法連接到伺服器', 'ERROR');
      log(`錯誤: ${error.message}`, 'ERROR');
      log(`請確保伺服器在 ${config.baseURL} 運行`, 'WARNING');
      log('啟動命令: npm run dev', 'INFO');
      process.exit(1);
    });
}