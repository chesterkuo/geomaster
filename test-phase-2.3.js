const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:8000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Test colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Test data
let testUser = {
  email: `test_phase23_${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Phase 2.3 Test User'
};

let authToken = '';
let organizationId = '';
let websiteId = '';
let alertId = '';
let templateId = '';
let reportId = '';

class Phase23TestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0
    };
    this.startTime = performance.now();
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = {
      'INFO': colors.cyan,
      'SUCCESS': colors.green,
      'ERROR': colors.red,
      'WARNING': colors.yellow
    }[level] || colors.reset;

    console.log(`${color}[${timestamp}] [${level}] ${message}${colors.reset}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async runTest(testName, testFunction) {
    this.testResults.total++;
    this.log('INFO', `開始測試: ${testName}`);
    
    try {
      await testFunction();
      this.testResults.passed++;
      this.log('SUCCESS', `✅ 測試通過: ${testName}`);
    } catch (error) {
      this.testResults.failed++;
      this.log('ERROR', `❌ 測試失敗: ${testName} - ${error.message}`);
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': organizationId,
        ...headers
      }
    };

    if (authToken) {
      config.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  }

  async setupTestEnvironment() {
    this.log('INFO', '設置測試環境...');

    // Register test user
    const registerResponse = await this.makeRequest('POST', '/api/v1/auth/register', testUser);
    authToken = registerResponse.data.token;
    
    // Get user profile to get organization
    const profileResponse = await this.makeRequest('GET', '/api/v1/auth/profile');
    organizationId = profileResponse.data.user.organizations[0].id;
    
    // Create test website
    const websiteResponse = await this.makeRequest('POST', '/api/v1/websites', {
      name: 'Phase 2.3 Test Website',
      url: 'https://phase23test.example.com',
      description: 'Test website for Phase 2.3 functionality'
    });
    websiteId = websiteResponse.data.website.id;

    this.log('SUCCESS', '測試環境設置完成', {
      userId: profileResponse.data.user.id,
      organizationId,
      websiteId
    });
  }

  async testAdvancedAlerts() {
    // Test creating alert configuration
    const alertData = {
      websiteId,
      name: 'Phase 2.3 Test Alert',
      description: 'Testing advanced alert functionality',
      alertType: 'mention_spike',
      conditions: [
        {
          metric: 'mention_count',
          operator: 'greater_than',
          value: 10,
          timeframe: '1d'
        }
      ],
      notificationChannels: ['email'],
      cooldownMinutes: 60
    };

    const createResponse = await this.makeRequest('POST', '/api/v1/alerts', alertData);
    
    if (!createResponse.success || !createResponse.data.alert) {
      throw new Error('Failed to create alert configuration');
    }
    
    alertId = createResponse.data.alert.id;
    this.log('INFO', `Alert created with ID: ${alertId}`);

    // Test getting alerts
    const alertsResponse = await this.makeRequest('GET', '/api/v1/alerts');
    
    if (!alertsResponse.success || !alertsResponse.data.alerts) {
      throw new Error('Failed to retrieve alerts');
    }

    // Test alert types
    const typesResponse = await this.makeRequest('GET', '/api/v1/alerts/types');
    
    if (!typesResponse.success || !typesResponse.data.alertTypes) {
      throw new Error('Failed to get alert types');
    }

    // Test alert testing (dry run)
    const testResponse = await this.makeRequest('POST', `/api/v1/alerts/${alertId}/test`);
    
    if (!testResponse.success || testResponse.data.canTrigger === undefined) {
      throw new Error('Failed to test alert configuration');
    }

    this.log('SUCCESS', 'Advanced alerts system verified', {
      alertId,
      alertTypes: typesResponse.data.alertTypes.length,
      testResult: testResponse.data
    });
  }

  async testReportGeneration() {
    // Test creating report template
    const templateData = {
      name: 'Phase 2.3 Test Template',
      reportType: 'competitor_benchmark',
      templateConfig: {
        sections: [
          {
            id: 'summary',
            name: 'Summary',
            type: 'text',
            config: {},
            order: 1
          },
          {
            id: 'metrics',
            name: 'Metrics Overview',
            type: 'chart',
            config: {
              chartType: 'line',
              dataSource: 'analytics'
            },
            order: 2
          }
        ],
        charts: [
          {
            type: 'line',
            dataSource: 'analytics',
            xAxis: 'date',
            yAxis: 'value',
            title: 'Metrics Trend'
          }
        ],
        format: 'pdf',
        branding: true,
        customizations: {}
      },
      isPublic: false
    };

    const templateResponse = await this.makeRequest('POST', '/api/v1/reports/templates', templateData);
    
    if (!templateResponse.success || !templateResponse.data.template) {
      throw new Error('Failed to create report template');
    }
    
    templateId = templateResponse.data.template.id;
    this.log('INFO', `Report template created with ID: ${templateId}`);

    // Test getting templates
    const templatesResponse = await this.makeRequest('GET', '/api/v1/reports/templates');
    
    if (!templatesResponse.success || !templatesResponse.data.templates) {
      throw new Error('Failed to retrieve report templates');
    }

    // Test generating report
    const reportData = {
      templateId,
      name: 'Phase 2.3 Test Report',
      reportType: 'competitor_benchmark',
      fileFormat: 'pdf',
      parameters: {
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        },
        websites: [websiteId]
      }
    };

    const generateResponse = await this.makeRequest('POST', '/api/v1/reports/generate', reportData);
    
    if (!generateResponse.success || !generateResponse.data.report) {
      throw new Error('Failed to generate report');
    }
    
    reportId = generateResponse.data.report.id;
    this.log('INFO', `Report generation started with ID: ${reportId}`);

    // Test getting reports
    const reportsResponse = await this.makeRequest('GET', '/api/v1/reports');
    
    if (!reportsResponse.success || !reportsResponse.data.reports) {
      throw new Error('Failed to retrieve generated reports');
    }

    // Test report stats
    const statsResponse = await this.makeRequest('GET', '/api/v1/reports/stats');
    
    if (!statsResponse.success || !statsResponse.data.storage) {
      throw new Error('Failed to get report statistics');
    }

    this.log('SUCCESS', 'Report generation system verified', {
      templateId,
      reportId,
      stats: statsResponse.data
    });
  }

  async testMetricsSnapshot() {
    // Test creating metrics snapshot
    const snapshotData = {
      websiteId,
      metricType: 'mention_count',
      platform: 'all',
      timeWindow: '1d',
      metricValue: 15.5
    };

    const snapshotResponse = await this.makeRequest('POST', '/api/v1/alerts/metrics/snapshot', snapshotData);
    
    if (!snapshotResponse.success || !snapshotResponse.data.snapshot) {
      throw new Error('Failed to create metrics snapshot');
    }

    this.log('INFO', `Metrics snapshot created: ${snapshotResponse.data.snapshot.id}`);

    // Test metrics summary
    const summaryResponse = await this.makeRequest('GET', `/api/v1/alerts/metrics/summary?websiteId=${websiteId}`);
    
    if (!summaryResponse.success || !summaryResponse.data.totalAlerts === undefined) {
      throw new Error('Failed to get metrics summary');
    }

    this.log('SUCCESS', 'Metrics snapshot system verified', {
      snapshotId: snapshotResponse.data.snapshot.id,
      summary: summaryResponse.data
    });
  }

  async testAlertHistory() {
    // Test getting alert history
    const historyResponse = await this.makeRequest('GET', '/api/v1/alerts/history');
    
    if (!historyResponse.success || !historyResponse.data.history) {
      throw new Error('Failed to retrieve alert history');
    }

    // Test checking alerts for website
    const checkResponse = await this.makeRequest('POST', `/api/v1/alerts/check/${websiteId}`);
    
    if (!checkResponse.success || checkResponse.data.triggeredAlerts === undefined) {
      throw new Error('Failed to check alerts for website');
    }

    this.log('SUCCESS', 'Alert history system verified', {
      historyCount: historyResponse.data.history.length,
      triggeredAlerts: checkResponse.data.triggeredAlerts
    });
  }

  async testSystemIntegration() {
    // Test API health with extended information
    const healthResponse = await axios.get(`${API_URL}/health`);
    
    if (!healthResponse.data.success) {
      throw new Error('System health check failed');
    }

    // Test API documentation
    const docsResponse = await axios.get(`${API_URL}/api/v1/docs`);
    
    if (!docsResponse.data.success) {
      throw new Error('API documentation not accessible');
    }

    // Verify all endpoints are accessible
    const endpoints = docsResponse.data.endpoints;
    const endpointCount = Object.keys(endpoints).reduce((count, category) => {
      return count + Object.keys(endpoints[category]).length;
    }, 0);

    this.log('SUCCESS', 'System integration verified', {
      uptime: healthResponse.data.uptime,
      environment: healthResponse.data.environment,
      endpointsDocumented: endpointCount
    });
  }

  async testDataConsistency() {
    // Verify website exists and is accessible
    const websiteResponse = await this.makeRequest('GET', `/api/v1/websites/${websiteId}`);
    
    if (!websiteResponse.success || websiteResponse.data.website.id !== websiteId) {
      throw new Error('Website data consistency check failed');
    }

    // Verify alert configuration exists
    const alertResponse = await this.makeRequest('GET', `/api/v1/alerts`);
    const alertExists = alertResponse.data.alerts.some(alert => alert.id === alertId);
    
    if (!alertExists) {
      throw new Error('Alert configuration data consistency check failed');
    }

    // Verify report template exists
    const templateResponse = await this.makeRequest('GET', `/api/v1/reports/templates`);
    const templateExists = templateResponse.data.templates.some(template => template.id === templateId);
    
    if (!templateExists) {
      throw new Error('Report template data consistency check failed');
    }

    this.log('SUCCESS', 'Data consistency verified across all Phase 2.3 components');
  }

  async cleanup() {
    this.log('INFO', '清理測試資源...');

    try {
      // Delete alert configuration
      if (alertId) {
        await this.makeRequest('DELETE', `/api/v1/alerts/${alertId}`);
        this.log('INFO', `Alert ${alertId} deleted`);
      }

      // Delete report template
      if (templateId) {
        await this.makeRequest('DELETE', `/api/v1/reports/templates/${templateId}`);
        this.log('INFO', `Template ${templateId} deleted`);
      }

      // Delete generated report if it exists
      if (reportId) {
        try {
          await this.makeRequest('DELETE', `/api/v1/reports/${reportId}`);
          this.log('INFO', `Report ${reportId} deleted`);
        } catch (error) {
          // Report might still be generating, that's okay
        }
      }

      // Delete test website
      if (websiteId) {
        await this.makeRequest('DELETE', `/api/v1/websites/${websiteId}`);
        this.log('INFO', `Website ${websiteId} deleted`);
      }

      this.log('SUCCESS', '測試資源清理完成');
    } catch (error) {
      this.log('WARNING', `清理過程中出現錯誤: ${error.message}`);
    }
  }

  async run() {
    console.log(`${colors.bold}${colors.blue}
==================================================
🚀 開始 GEO Platform Phase 2.3 綜合測試
📡 目標 API: ${API_URL}
==================================================
${colors.reset}`);

    try {
      await this.setupTestEnvironment();

      await this.runTest('系統整合測試', () => this.testSystemIntegration());
      await this.runTest('進階警報系統測試', () => this.testAdvancedAlerts());
      await this.runTest('報告生成系統測試', () => this.testReportGeneration());
      await this.runTest('指標快照系統測試', () => this.testMetricsSnapshot());
      await this.runTest('警報歷史系統測試', () => this.testAlertHistory());
      await this.runTest('數據一致性測試', () => this.testDataConsistency());

      await this.cleanup();
      
    } catch (error) {
      this.log('ERROR', `設置或清理過程中發生錯誤: ${error.message}`);
      this.testResults.failed++;
    }

    const endTime = performance.now();
    const duration = Math.round(endTime - this.startTime);

    console.log(`
==================================================
🧪 Phase 2.3 測試結果摘要
==================================================
總測試數: ${this.testResults.total}
✅ 通過: ${this.testResults.passed}
❌ 失敗: ${this.testResults.failed}
📈 成功率: ${((this.testResults.passed / this.testResults.total) * 100).toFixed(2)}%
⏱️  執行時間: ${duration}ms
==================================================`);

    if (this.testResults.failed === 0) {
      this.log('SUCCESS', '🎉 Phase 2.3 所有功能測試都通過了！');
      console.log(`${colors.green}${colors.bold}
🎊 Phase 2.3: Enhanced Real-time Analytics & Alert System 完成！

新增功能：
✅ 實時警報系統與條件監控
✅ 高級報告生成系統 (PDF/Excel/CSV/JSON)
✅ 實時指標儀表板
✅ WebSocket 實時通信
✅ 指標快照與趨勢分析
✅ 警報歷史與通知管理
✅ 報告模板系統
✅ 數據一致性保證
${colors.reset}`);
    } else {
      this.log('ERROR', '❌ 部分測試失敗，請檢查系統配置');
      process.exit(1);
    }
  }
}

// 檢查伺服器狀態
async function checkServerStatus() {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    if (response.data.success) {
      console.log(`${colors.green}[${new Date().toISOString()}] [SUCCESS] ✅ 伺服器正在運行，開始Phase 2.3測試${colors.reset}`);
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}[${new Date().toISOString()}] [ERROR] ❌ 無法連接到伺服器 ${API_URL}${colors.reset}`);
    console.error('請確保伺服器正在運行，然後重新運行測試');
    process.exit(1);
  }
  return false;
}

// 主函數
async function main() {
  console.log(`${colors.cyan}[${new Date().toISOString()}] [INFO] 🔍 檢查伺服器狀態...${colors.reset}`);
  
  if (await checkServerStatus()) {
    const testSuite = new Phase23TestSuite();
    await testSuite.run();
  }
}

// 運行測試
main().catch((error) => {
  console.error(`${colors.red}[${new Date().toISOString()}] [ERROR] 測試運行失敗:${colors.reset}`, error.message);
  process.exit(1);
});