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
  baseURL: process.env.API_URL || 'https://api-geo.blitzgame.site',
  timeout: 30000,
  testUser: {
    email: `test_${Date.now()}@example.com`,
    password: 'Test123456',
    fullName: 'Test User',
    company: 'Test Company'
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
      'User-Agent': 'GEO-Platform-API-Test/1.0',
      ...headers
    };
    
    if (testData.accessToken) {
      defaultHeaders.Authorization = `Bearer ${testData.accessToken}`;
    }
    
    if (testData.organization) {
      defaultHeaders['X-Organization-ID'] = testData.organization.id;
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
      testData.organization = response.data.data.organization;
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
    runner.assert(response.data.data && response.data.data.organizations, '登入應該返回組織列表');
    
    // 更新令牌和組織資料
    if (response.data.data && response.data.data.token) {
      testData.accessToken = response.data.data.token;
    }
    if (response.data.data && response.data.data.organizations && response.data.data.organizations.length > 0) {
      testData.organization = response.data.data.organizations[0];
    }
    
    log(`用戶已登入: ${config.testUser.email}`, 'INFO');
  });

  // 獲取用戶資料
  await runner.test('獲取用戶資料', async () => {
    const response = await makeRequest('GET', '/api/v1/auth/profile');
    
    runner.assert(response.status === 200, `獲取用戶資料應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '獲取用戶資料應該返回 success: true');
    runner.assert(response.data.data && response.data.data.user && response.data.data.user.id, '應該返回用戶資料');
    runner.assert(response.data.data && response.data.data.organizations, '應該返回組織列表');
    
    log(`獲取用戶資料成功: ${response.data.data.user?.email || 'N/A'}`, 'INFO');
  });

  // 創建測試網站
  await runner.test('創建網站', async () => {
    const websiteData = {
      url: 'https://example.com',
      name: 'Test Website',
      description: 'Website for API testing',
      scanFrequency: 'weekly'
    };
    
    const response = await makeRequest('POST', '/api/v1/websites', websiteData);
    
    runner.assert(response.status === 201, `創建網站應該返回 201，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '創建網站應該返回 success: true');
    runner.assert(response.data.data && response.data.data.website && response.data.data.website.url === websiteData.url, '網站 URL 應該匹配');
    
    // 保存網站資料
    if (response.data.data && response.data.data.website) {
      testData.website = response.data.data.website;
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

  // 新增測試：內容優化建議 ✅ 已實作
  await runner.test('內容優化建議', async () => {
    const optimizationData = {
      url: 'https://example.com',
      provider: 'gemini'  // Use Gemini as default to avoid OpenAI API key issues
    };
    
    const response = await makeRequest('POST', '/api/v1/content/optimization-suggestions', optimizationData);
    
    runner.assert(response.status === 200, `內容優化建議應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '內容優化建議應該返回 success: true');
    runner.assert(response.data.data && typeof response.data.data.geoScore === 'number', '應該返回 GEO 評分');
    
    log(`優化建議測試通過，GEO分數: ${response.data.data.geoScore || response.data.data.score}`, 'INFO');
  });

  // 新增測試：AI 提及追蹤 ✅ 已實作  
  await runner.test('AI 提及追蹤', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/mentions?page=1&limit=10');
    
    runner.assert(response.status === 200, `AI 提及追蹤應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, 'AI 提及追蹤應該返回 success: true');
    runner.assert(response.data.data && Array.isArray(response.data.data.mentions), '應該返回提及記錄數組');
    runner.assert(response.data.data.summary && typeof response.data.data.summary.total === 'number', '應該返回統計摘要');
    
    log(`AI 提及追蹤測試通過，總提及數: ${response.data.data.summary.total}`, 'INFO');
  });

  // 新增測試：可見度趨勢 ✅ 已實作
  await runner.test('可見度趨勢分析', async () => {
    // Use the websiteId from the previously created test website
    const websiteId = testData.website?.id || 'test-website-id';
    const response = await makeRequest('GET', `/api/v1/tracking/visibility-trends?websiteId=${websiteId}&period=30d`);
    
    runner.assert(response.status === 200, `可見度趨勢應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '可見度趨勢應該返回 success: true');
    runner.assert(response.data.data && Array.isArray(response.data.data.trends), '應該返回趨勢數據數組');
    runner.assert(response.data.data.summary && typeof response.data.data.summary.averageVisibility === 'number', '應該返回趨勢摘要');
    
    log(`可見度趨勢測試通過，平均可見度: ${response.data.data.summary.averageVisibility}`, 'INFO');
  });

  // 新增測試：儀表板統計 ✅ 已實作
  await runner.test('儀表板統計資料', async () => {
    const response = await makeRequest('GET', '/api/v1/dashboard/stats');
    
    runner.assert(response.status === 200, `儀表板統計應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '儀表板統計應該返回 success: true');
    runner.assert(response.data.data && response.data.data.overview, '應該返回概覽統計');
    runner.assert(response.data.data.overview.totalWebsites >= 0, '應該返回網站總數');
    runner.assert(Array.isArray(response.data.data.recentActivity), '應該返回最近活動數組');
    
    log(`儀表板統計測試通過，網站總數: ${response.data.data.overview.totalWebsites}`, 'INFO');
  });

  // === 新增 AI 搜尋擴展 API 測試 ===

  // 關鍵字管理測試
  let testKeywordId = null;
  
  await runner.test('獲取關鍵字類型', async () => {
    const response = await makeRequest('GET', '/api/v1/keywords/types');
    
    runner.assert(response.status === 200, `獲取關鍵字類型應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '關鍵字類型應該返回 success: true');
    runner.assert(Array.isArray(response.data.data), '應該返回類型數組');
    runner.assert(response.data.data.length > 0, '關鍵字類型不應該為空');
    
    log(`獲取到 ${response.data.data.length} 個關鍵字類型`, 'INFO');
  });

  await runner.test('新增關鍵字', async () => {
    const keywordData = {
      keyword: 'ai optimization test',
      intent: 'commercial',
      searchVolume: 1000,
      difficulty: 45.5,
      cpc: 2.50
    };
    
    const response = await makeRequest('POST', '/api/v1/keywords', keywordData);
    
    runner.assert(response.status === 201, `新增關鍵字應該返回 201，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '新增關鍵字應該返回 success: true');
    runner.assert(response.data.data && response.data.data.id, '應該返回關鍵字 ID');
    runner.assert(response.data.data.keyword === keywordData.keyword.toLowerCase().trim(), '關鍵字應該匹配');
    
    testKeywordId = response.data.data.id;
    log(`關鍵字已創建: ${keywordData.keyword} (${testKeywordId})`, 'INFO');
  });

  await runner.test('獲取關鍵字列表', async () => {
    const response = await makeRequest('GET', '/api/v1/keywords?page=1&limit=10');
    
    runner.assert(response.status === 200, `獲取關鍵字列表應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '關鍵字列表應該返回 success: true');
    runner.assert(response.data.data && Array.isArray(response.data.data.keywords), '應該返回關鍵字數組');
    runner.assert(response.data.data.pagination && typeof response.data.data.pagination.total === 'number', '應該返回分頁資訊');
    
    log(`找到 ${response.data.data.keywords.length} 個關鍵字`, 'INFO');
  });

  if (testKeywordId) {
    await runner.test('更新關鍵字', async () => {
      const updateData = {
        searchVolume: 1500,
        difficulty: 50.0
      };
      
      const response = await makeRequest('PUT', `/api/v1/keywords/${testKeywordId}`, updateData);
      
      runner.assert(response.status === 200, `更新關鍵字應該返回 200，實際返回 ${response.status}`);
      runner.assert(response.data.success === true, '更新關鍵字應該返回 success: true');
      runner.assert(response.data.data.searchVolume === updateData.searchVolume, '搜索量應該更新');
      
      log(`關鍵字已更新: ${testKeywordId}`, 'INFO');
    });
  }

  // 追蹤配置測試
  await runner.test('獲取追蹤設定', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/settings');
    
    runner.assert(response.status === 200, `獲取追蹤設定應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '追蹤設定應該返回 success: true');
    runner.assert(response.data.data && typeof response.data.data.trackingEnabled === 'boolean', '應該返回追蹤啟用狀態');
    runner.assert(Array.isArray(response.data.data.platforms), '應該返回平台列表');
    
    log(`追蹤設定獲取成功，啟用狀態: ${response.data.data.trackingEnabled}`, 'INFO');
  });

  await runner.test('更新追蹤設定', async () => {
    const settingsData = {
      trackingEnabled: true,
      trackingFrequency: 'daily',
      platforms: ['chatgpt', 'gemini'],
      alertsEnabled: false,
      alertThreshold: 10
    };
    
    const response = await makeRequest('PUT', '/api/v1/tracking/settings', settingsData);
    
    runner.assert(response.status === 200, `更新追蹤設定應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '更新追蹤設定應該返回 success: true');
    runner.assert(response.data.data.trackingFrequency === settingsData.trackingFrequency, '追蹤頻率應該更新');
    
    log(`追蹤設定已更新: ${settingsData.trackingFrequency}`, 'INFO');
  });

  await runner.test('獲取監控平台', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/platforms');
    
    runner.assert(response.status === 200, `獲取監控平台應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '監控平台應該返回 success: true');
    runner.assert(Array.isArray(response.data.data), '應該返回平台設定數組');
    
    log(`找到 ${response.data.data.length} 個平台設定`, 'INFO');
  });

  await runner.test('配置平台監控', async () => {
    const platformData = {
      platform: 'chatgpt',
      enabled: true,
      settings: {
        priority: 'high',
        maxQueries: 100
      }
    };
    
    const response = await makeRequest('POST', '/api/v1/tracking/platforms', platformData);
    
    runner.assert(response.status === 200, `配置平台監控應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '配置平台監控應該返回 success: true');
    runner.assert(response.data.data.platform === platformData.platform, '平台名稱應該匹配');
    
    log(`平台監控已配置: ${platformData.platform}`, 'INFO');
  });

  // 競爭對手分析測試
  let testCompetitorId = null;

  await runner.test('新增競爭對手', async () => {
    const competitorData = {
      websiteUrl: 'https://competitor-example.com',
      name: 'Test Competitor'
    };
    
    const response = await makeRequest('POST', '/api/v1/tracking/competitors', competitorData);
    
    runner.assert(response.status === 201, `新增競爭對手應該返回 201，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '新增競爭對手應該返回 success: true');
    runner.assert(response.data.data && response.data.data.id, '應該返回競爭對手 ID');
    runner.assert(response.data.data.websiteUrl === competitorData.websiteUrl, '網站 URL 應該匹配');
    
    testCompetitorId = response.data.data.id;
    log(`競爭對手已創建: ${competitorData.name} (${testCompetitorId})`, 'INFO');
  });

  await runner.test('獲取競爭對手列表', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/competitors?page=1&limit=10');
    
    runner.assert(response.status === 200, `獲取競爭對手列表應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '競爭對手列表應該返回 success: true');
    runner.assert(response.data.data && Array.isArray(response.data.data.competitors), '應該返回競爭對手數組');
    runner.assert(response.data.data.pagination && typeof response.data.data.pagination.total === 'number', '應該返回分頁資訊');
    
    log(`找到 ${response.data.data.competitors.length} 個競爭對手`, 'INFO');
  });

  await runner.test('獲取競爭分析', async () => {
    const response = await makeRequest('GET', '/api/v1/tracking/competitive-analysis?timeframe=30d');
    
    runner.assert(response.status === 200, `獲取競爭分析應該返回 200，實際返回 ${response.status}`);
    runner.assert(response.data.success === true, '競爭分析應該返回 success: true');
    runner.assert(response.data.data && response.data.data.organization, '應該返回組織數據');
    runner.assert(Array.isArray(response.data.data.competitors), '應該返回競爭對手數據數組');
    runner.assert(response.data.data.timeframe && response.data.data.timeframe.period === '30d', '時間範圍應該匹配');
    
    log(`競爭分析獲取成功，對手數量: ${response.data.data.competitors.length}`, 'INFO');
  });

  // 清理新增的測試資料
  if (testKeywordId) {
    await runner.test('清理測試關鍵字', async () => {
      const response = await makeRequest('DELETE', `/api/v1/keywords/${testKeywordId}`);
      
      runner.assert(
        response.status === 200 || response.status === 204 || response.status === 404, 
        '刪除關鍵字應該返回 200/204/404 狀態碼'
      );
      
      log(`測試關鍵字已清理: ${testKeywordId}`, 'INFO');
    });
  }

  if (testCompetitorId) {
    await runner.test('清理測試競爭對手', async () => {
      const response = await makeRequest('DELETE', `/api/v1/tracking/competitors/${testCompetitorId}`);
      
      runner.assert(
        response.status === 200 || response.status === 204 || response.status === 404, 
        '刪除競爭對手應該返回 200/204/404 狀態碼'
      );
      
      log(`測試競爭對手已清理: ${testCompetitorId}`, 'INFO');
    });
  }

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