#!/usr/bin/env node

/**
 * GEO Platform API 測試腳本
 * 用於驗證後端 API 功能性
 * 
 * 使用方法:
 * node test-api.js
 * 
 * 或者添加特定測試:
 * node test-api.js --test=auth
 * node test-api.js --test=websites
 * node test-api.js --test=scans
 */

const axios = require('axios');
const colors = require('colors');

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

// 全局變數存儲測試資料
let testData = {
  accessToken: null,
  refreshToken: null,
  user: null,
  organization: null,
  website: null,
  scan: null
};

// HTTP 客戶端
const api = axios.create({
  baseURL: `${config.baseURL}/api/v1`,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 請求攔截器 - 添加認證 token 和組織 ID
api.interceptors.request.use((config) => {
  if (testData.accessToken) {
    config.headers.Authorization = `Bearer ${testData.accessToken}`;
  }
  if (testData.organization) {
    config.headers['X-Organization-ID'] = testData.organization.id;
  }
  return config;
});

// 測試工具函數
class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}]`;
    
    switch (type) {
      case 'success':
        console.log(`${prefix} ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`${prefix} ❌ ${message}`.red);
        break;
      case 'warning':
        console.log(`${prefix} ⚠️  ${message}`.yellow);
        break;
      case 'info':
        console.log(`${prefix} ℹ️  ${message}`.blue);
        break;
      default:
        console.log(`${prefix} ${message}`);
    }
  }

  async test(name, testFn) {
    try {
      this.log(`開始測試: ${name}`, 'info');
      await testFn();
      this.passed++;
      this.log(`測試通過: ${name}`, 'success');
    } catch (error) {
      this.failed++;
      this.log(`測試失敗: ${name} - ${error.message}`, 'error');
      if (error.response) {
        this.log(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
  }

  async assert(condition, message) {
    if (!condition) {
      throw new Error(`斷言失敗: ${message}`);
    }
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed;
    
    console.log('\n' + '='.repeat(50));
    console.log('測試結果摘要'.bold);
    console.log('='.repeat(50));
    console.log(`總測試數: ${total}`);
    console.log(`通過: ${this.passed}`.green);
    console.log(`失敗: ${this.failed}`.red);
    console.log(`成功率: ${total > 0 ? ((this.passed / total) * 100).toFixed(2) : 0}%`);
    console.log(`執行時間: ${duration}ms`);
    console.log('='.repeat(50));
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// 健康檢查測試
async function testHealth(runner) {
  await runner.test('健康檢查', async () => {
    const response = await axios.get(`${config.baseURL}/health`);
    await runner.assert(response.status === 200, '健康檢查應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '健康檢查應該返回 success: true');
    runner.log(`健康檢查回應: ${JSON.stringify(response.data)}`, 'info');
  });
}

// 認證測試
async function testAuth(runner) {
  // 用戶註冊
  await runner.test('用戶註冊', async () => {
    const response = await api.post('/auth/register', config.testUser);
    
    await runner.assert(response.status === 201, '註冊應該返回 201 狀態碼');
    await runner.assert(response.data.success === true, '註冊應該返回 success: true');
    await runner.assert(response.data.data.user, '註冊應該返回用戶資料');
    await runner.assert(response.data.data.token, '註冊應該返回訪問令牌');
    
    // 保存測試資料
    testData.accessToken = response.data.data.token;
    testData.refreshToken = response.data.data.refreshToken;
    testData.user = response.data.data.user;
    testData.organization = response.data.data.organization;
    
    runner.log(`用戶已註冊: ${response.data.data.user.email}`, 'info');
  });

  // 用戶登入
  await runner.test('用戶登入', async () => {
    const response = await api.post('/auth/login', {
      email: config.testUser.email,
      password: config.testUser.password
    });
    
    await runner.assert(response.status === 200, '登入應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '登入應該返回 success: true');
    await runner.assert(response.data.data.user, '登入應該返回用戶資料');
    await runner.assert(response.data.data.token, '登入應該返回訪問令牌');
    
    // 更新令牌和組織
    testData.accessToken = response.data.data.token;
    if (response.data.data.organizations && response.data.data.organizations.length > 0) {
      testData.organization = response.data.data.organizations[0];
    }
    
    runner.log(`用戶已登入: ${response.data.data.user.email}`, 'info');
  });

  // 獲取用戶資料
  await runner.test('獲取用戶資料', async () => {
    const response = await api.get('/auth/profile');
    
    await runner.assert(response.status === 200, '獲取用戶資料應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取用戶資料應該返回 success: true');
    await runner.assert(response.data.data.user && response.data.data.user.id === testData.user.id, '返回的用戶 ID 應該匹配');
    
    runner.log(`用戶資料: ${response.data.data.user.email}`, 'info');
  });

  // 更新用戶資料
  await runner.test('更新用戶資料', async () => {
    const updateData = {
      fullName: '更新後的測試用戶',
      company: '更新後的測試公司'
    };
    
    const response = await api.put('/auth/profile', updateData);
    
    await runner.assert(response.status === 200, '更新用戶資料應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '更新用戶資料應該返回 success: true');
    await runner.assert(response.data.data.user.fullName === updateData.fullName, '用戶姓名應該已更新');
    await runner.assert(response.data.data.user.company === updateData.company, '公司名稱應該已更新');
    
    runner.log(`用戶資料已更新: ${response.data.data.user.fullName}`, 'info');
  });

  // 令牌刷新
  await runner.test('刷新訪問令牌', async () => {
    const response = await api.post('/auth/refresh', {
      refreshToken: testData.refreshToken
    });
    
    await runner.assert(response.status === 200, '刷新令牌應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '刷新令牌應該返回 success: true');
    await runner.assert(response.data.data.token, '應該返回新的訪問令牌');
    await runner.assert(response.data.data.refreshToken, '應該返回新的刷新令牌');
    
    // 更新令牌
    testData.accessToken = response.data.data.token;
    testData.refreshToken = response.data.data.refreshToken;
    
    runner.log('訪問令牌已刷新', 'info');
  });

  // 忘記密碼
  await runner.test('請求密碼重置', async () => {
    const response = await api.post('/auth/forgot-password', {
      email: config.testUser.email
    });
    
    await runner.assert(response.status === 200, '請求密碼重置應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '請求密碼重置應該返回 success: true');
    await runner.assert(response.data.message, '應該返回提示訊息');
    
    // 在開發環境中保存重置令牌用於測試
    if (response.data.resetToken) {
      testData.resetToken = response.data.resetToken;
    }
    
    runner.log('密碼重置請求已發送', 'info');
  });

  // 重置密碼（僅在開發環境中測試）
  if (process.env.NODE_ENV === 'development' && testData.resetToken) {
    await runner.test('重置密碼', async () => {
      const newPassword = 'NewPass123456';
      const response = await api.post('/auth/reset-password', {
        token: testData.resetToken,
        password: newPassword
      });
      
      await runner.assert(response.status === 200, '重置密碼應該返回 200 狀態碼');
      await runner.assert(response.data.success === true, '重置密碼應該返回 success: true');
      await runner.assert(response.data.message, '應該返回成功訊息');
      
      // 更新測試用戶密碼
      config.testUser.password = newPassword;
      
      runner.log('密碼已成功重置', 'info');
    });
  }

  // 用戶登出
  await runner.test('用戶登出', async () => {
    const response = await api.post('/auth/logout');
    
    await runner.assert(response.status === 200, '登出應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '登出應該返回 success: true');
    await runner.assert(response.data.message, '應該返回登出訊息');
    
    runner.log('用戶已登出', 'info');
  });
}

// 網站管理測試
async function testWebsites(runner) {
  // 創建網站
  await runner.test('創建網站', async () => {
    const websiteData = {
      url: 'https://example.com',
      name: 'Test Website',
      description: 'Website for API testing',
      scanFrequency: 'weekly'
    };
    
    const response = await api.post('/websites', websiteData);
    
    await runner.assert(response.status === 201, '創建網站應該返回 201 狀態碼');
    await runner.assert(response.data.success === true, '創建網站應該返回 success: true');
    await runner.assert(response.data.data.website && response.data.data.website.url === websiteData.url, '網站 URL 應該匹配');
    
    // 保存網站資料
    testData.website = response.data.data.website;
    
    runner.log(`網站已創建: ${response.data.data.website.name} (${response.data.data.website.url})`, 'info');
  });

  // 獲取網站列表
  await runner.test('獲取網站列表', async () => {
    const response = await api.get('/websites');
    
    await runner.assert(response.status === 200, '獲取網站列表應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取網站列表應該返回 success: true');
    await runner.assert(Array.isArray(response.data.data.websites), '網站列表應該是數組');
    await runner.assert(response.data.data.websites.length > 0, '網站列表不應該為空');
    
    runner.log(`找到 ${response.data.data.websites.length} 個網站`, 'info');
  });

  // 獲取單個網站
  await runner.test('獲取單個網站', async () => {
    const response = await api.get(`/websites/${testData.website.id}`);
    
    await runner.assert(response.status === 200, '獲取網站應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取網站應該返回 success: true');
    await runner.assert(response.data.data.website && response.data.data.website.id === testData.website.id, '網站 ID 應該匹配');
    
    runner.log(`網站詳情: ${response.data.data.website.name}`, 'info');
  });

  // 更新網站
  await runner.test('更新網站', async () => {
    const updateData = {
      name: 'Updated Test Website',
      description: 'Updated website description'
    };
    
    const response = await api.put(`/websites/${testData.website.id}`, updateData);
    
    await runner.assert(response.status === 200, '更新網站應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '更新網站應該返回 success: true');
    await runner.assert(response.data.data.website && response.data.data.website.name === updateData.name, '網站名稱應該已更新');
    
    runner.log(`網站已更新: ${response.data.data.website.name}`, 'info');
  });

  // 獲取網站內容
  await runner.test('獲取網站內容', async () => {
    const response = await api.get(`/websites/${testData.website.id}/content`);
    
    await runner.assert(response.status === 200, '獲取網站內容應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取網站內容應該返回 success: true');
    await runner.assert(Array.isArray(response.data.data.contents), '內容列表應該是數組');
    await runner.assert(response.data.data.pagination, '應該包含分頁資訊');
    
    runner.log(`網站內容頁數: ${response.data.data.contents.length}`, 'info');
  });

  // 獲取網站分析
  await runner.test('獲取網站分析', async () => {
    const response = await api.get(`/websites/${testData.website.id}/analytics`);
    
    await runner.assert(response.status === 200, '獲取網站分析應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取網站分析應該返回 success: true');
    await runner.assert(response.data.data.website, '應該包含網站資料');
    await runner.assert(response.data.data.analytics, '應該包含分析資料');
    await runner.assert(response.data.data.analytics.content, '應該包含內容分析');
    await runner.assert(response.data.data.analytics.scans, '應該包含掃描分析');
    
    runner.log('網站分析數據已獲取', 'info');
  });

  // 測試網站列表搜尋功能
  await runner.test('搜尋網站', async () => {
    const response = await api.get(`/websites?search=Test&page=1&limit=5`);
    
    await runner.assert(response.status === 200, '搜尋網站應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '搜尋網站應該返回 success: true');
    await runner.assert(Array.isArray(response.data.data.websites), '搜尋結果應該是數組');
    await runner.assert(response.data.data.pagination, '應該包含分頁資訊');
    
    runner.log(`搜尋到 ${response.data.data.websites.length} 個網站`, 'info');
  });
}

// 掃描測試
async function testScans(runner) {
  // 開始掃描
  await runner.test('開始網站掃描', async () => {
    const response = await api.post('/scans', {
      websiteId: testData.website.id,
      scanType: 'quick'
    });
    
    await runner.assert(response.status === 201, '開始掃描應該返回 201 狀態碼');
    await runner.assert(response.data.success === true, '開始掃描應該返回 success: true');
    await runner.assert(response.data.data.websiteId === testData.website.id, '掃描的網站 ID 應該匹配');
    
    // 保存掃描資料
    testData.scan = response.data.data;
    
    runner.log(`掃描已開始: ${response.data.data.id}`, 'info');
  });

  // 獲取掃描狀態
  await runner.test('獲取掃描狀態', async () => {
    const response = await api.get(`/scans/${testData.scan.id}`);
    
    await runner.assert(response.status === 200, '獲取掃描狀態應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取掃描狀態應該返回 success: true');
    await runner.assert(response.data.data.id === testData.scan.id, '掃描 ID 應該匹配');
    
    runner.log(`掃描狀態: ${response.data.data.status}`, 'info');
  });

  // 獲取掃描列表
  await runner.test('獲取掃描列表', async () => {
    const response = await api.get(`/scans?websiteId=${testData.website.id}`);
    
    await runner.assert(response.status === 200, '獲取掃描列表應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取掃描列表應該返回 success: true');
    await runner.assert(Array.isArray(response.data.data), '掃描列表應該是數組');
    
    runner.log(`找到 ${response.data.data.length} 個掃描記錄`, 'info');
  });

  // 測試不同掃描類型
  await runner.test('開始標準掃描', async () => {
    const response = await api.post('/scans', {
      websiteId: testData.website.id,
      scanType: 'standard'
    });
    
    await runner.assert(response.status === 201, '標準掃描應該返回 201 狀態碼');
    await runner.assert(response.data.success === true, '標準掃描應該返回 success: true');
    await runner.assert(response.data.data.scanType === 'standard', '掃描類型應該是 standard');
    
    testData.standardScan = response.data.data;
    runner.log(`標準掃描已開始: ${response.data.data.id}`, 'info');
  });

  // 測試掃描列表分頁
  await runner.test('測試掃描列表分頁', async () => {
    const response = await api.get(`/scans?websiteId=${testData.website.id}&page=1&limit=5`);
    
    await runner.assert(response.status === 200, '掃描列表分頁應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '掃描列表分頁應該返回 success: true');
    await runner.assert(response.data.pagination, '應該包含分頁資訊');
    await runner.assert(Array.isArray(response.data.data), '掃描結果應該是數組');
    
    runner.log(`分頁掃描列表: ${response.data.data.length} 項`, 'info');
  });

  // 測試獲取所有掃描（不限制網站）
  await runner.test('獲取所有掃描', async () => {
    const response = await api.get('/scans');
    
    await runner.assert(response.status === 200, '獲取所有掃描應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取所有掃描應該返回 success: true');
    await runner.assert(Array.isArray(response.data.data), '所有掃描列表應該是數組');
    
    runner.log(`用戶所有掃描記錄: ${response.data.data.length} 項`, 'info');
  });
}

// 內容優化測試
async function testOptimization(runner) {
  await runner.test('獲取優化建議', async () => {
    const response = await api.post('/content/optimization-suggestions', {
      url: testData.website.url,
      content: 'Sample content for optimization'
    });
    
    await runner.assert(response.status === 200, '獲取優化建議應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取優化建議應該返回 success: true');
    await runner.assert(response.data.data.suggestions, '應該包含優化建議');
    
    runner.log(`找到優化建議`, 'info');
  });
}

// AI 追蹤測試
async function testAITracking(runner) {
  await runner.test('獲取 AI 提及', async () => {
    const response = await api.get(`/tracking/mentions?websiteId=${testData.website.id}`);
    
    // 這個端點可能返回空數組，這是預期的
    await runner.assert(response.status === 200, '獲取 AI 提及應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取 AI 提及應該返回 success: true');
    await runner.assert(response.data.data.mentions && Array.isArray(response.data.data.mentions), 'AI 提及應該是數組');
    
    runner.log(`找到 ${response.data.data.mentions.length} 個 AI 提及記錄`, 'info');
  });

  await runner.test('獲取可見度趨勢', async () => {
    const response = await api.get(`/tracking/visibility-trends?websiteId=${testData.website.id}`);
    
    // 這個端點可能返回空資料，這是預期的
    await runner.assert(response.status === 200, '獲取可見度趨勢應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取可見度趨勢應該返回 success: true');
    await runner.assert(response.data.data.trends, '應該包含趨勢資料');
    
    runner.log('可見度趨勢資料已獲取', 'info');
  });
}

// 儀表板測試
async function testDashboard(runner) {
  await runner.test('獲取儀表板統計', async () => {
    const response = await api.get('/dashboard/stats');
    
    await runner.assert(response.status === 200, '獲取儀表板統計應該返回 200 狀態碼');
    await runner.assert(response.data.success === true, '獲取儀表板統計應該返回 success: true');
    
    runner.log('儀表板統計已獲取', 'info');
  });
}

// 清理測試資料
async function cleanup(runner) {
  if (testData.website && testData.website.id) {
    await runner.test('清理測試網站', async () => {
      const response = await api.delete(`/websites/${testData.website.id}`);
      
      // 允許 404 狀態，表示網站已經不存在
      await runner.assert(
        response.status === 200 || response.status === 204 || response.status === 404, 
        '刪除網站應該返回 200/204/404 狀態碼'
      );
      
      runner.log(`測試網站已清理: ${testData.website.id}`, 'info');
    });
  }
}

// 主要測試執行器
async function runTests() {
  const runner = new TestRunner();
  
  console.log('🚀 開始 GEO Platform API 測試'.bold.green);
  console.log(`📡 目標 API: ${config.baseURL}`.blue);
  console.log('='.repeat(50));
  
  // 解析命令行參數
  const args = process.argv.slice(2);
  const testArg = args.find(arg => arg.startsWith('--test='));
  const specificTest = testArg ? testArg.split('=')[1] : null;

  try {
    // 檢查伺服器是否運行
    try {
      await axios.get(`${config.baseURL}/health`, { timeout: 5000 });
    } catch (error) {
      runner.log('⚠️  後端伺服器似乎沒有運行', 'warning');
      runner.log(`請確保伺服器在 ${config.baseURL} 運行`, 'warning');
      runner.log('啟動命令: npm run dev', 'info');
      return;
    }

    // 執行測試套件
    if (!specificTest || specificTest === 'health') {
      await testHealth(runner);
    }

    if (!specificTest || specificTest === 'auth') {
      await testAuth(runner);
    }

    if (!specificTest || specificTest === 'websites') {
      // 需要認證
      if (!testData.accessToken) {
        await testAuth(runner);
      }
      await testWebsites(runner);
    }

    if (!specificTest || specificTest === 'scans') {
      // 需要認證和網站
      if (!testData.accessToken) {
        await testAuth(runner);
      }
      if (!testData.website) {
        await testWebsites(runner);
      }
      await testScans(runner);
    }

    if (!specificTest || specificTest === 'optimization') {
      // 需要認證和網站
      if (!testData.accessToken) {
        await testAuth(runner);
      }
      if (!testData.website) {
        await testWebsites(runner);
      }
      await testOptimization(runner);
    }

    if (!specificTest || specificTest === 'tracking') {
      // 需要認證和網站
      if (!testData.accessToken) {
        await testAuth(runner);
      }
      if (!testData.website) {
        await testWebsites(runner);
      }
      await testAITracking(runner);
    }

    if (!specificTest || specificTest === 'dashboard') {
      // 需要認證
      if (!testData.accessToken) {
        await testAuth(runner);
      }
      await testDashboard(runner);
    }

    // 清理
    if (!specificTest || specificTest === 'cleanup') {
      await cleanup(runner);
    }

  } catch (error) {
    runner.log(`測試執行過程中發生意外錯誤: ${error.message}`, 'error');
  } finally {
    runner.summary();
  }
}

// 處理未捕獲的異常
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
  process.exit(1);
});

// 執行測試
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testHealth,
  testAuth,
  testWebsites,
  testScans,
  testOptimization,
  testAITracking,
  testDashboard,
  cleanup
};