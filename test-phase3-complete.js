const http = require('http');
const https = require('https');
const { URL } = require('url');

class Phase3CompleteTester {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.baseURL = new URL(apiUrl);
    this.httpModule = this.baseURL.protocol === 'https:' ? https : http;
    this.testResults = [];
    this.authToken = null;
    this.organizationId = null;
    this.createdResources = {
      suggestions: [],
      integrations: [],
      webhooks: [],
      workflows: [],
      experiments: [],
      variants: [],
      segments: []
    };
    
    this.colors = {
      green: '\x1b[32m',
      red: '\x1b[31m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m',
      bright: '\x1b[1m'
    };
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const colors = {
      'INFO': this.colors.blue,
      'SUCCESS': this.colors.green,
      'ERROR': this.colors.red,
      'WARNING': this.colors.yellow
    };
    
    const color = colors[level] || this.colors.reset;
    console.log(`${color}[${timestamp}] [${level}] ${message}${this.colors.reset}`);
  }

  async makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.apiUrl);
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'GEO-Phase3-Complete-Test/1.0'
      };

      if (this.authToken) {
        defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
      }

      if (this.organizationId) {
        defaultHeaders['X-Organization-ID'] = this.organizationId;
      }

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method,
        headers: { ...defaultHeaders, ...headers },
        timeout: 30000
      };

      const req = this.httpModule.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsedData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsedData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async test(name, testFn) {
    this.log('INFO', `Testing: ${name}`);
    try {
      await testFn();
      this.testResults.push({ name, status: 'PASSED' });
      this.log('SUCCESS', `✅ Passed: ${name}`);
    } catch (error) {
      this.testResults.push({ name, status: 'FAILED', error: error.message });
      this.log('ERROR', `❌ Failed: ${name} - ${error.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async setupTestEnvironment() {
    this.log('INFO', 'Setting up Phase 3 complete test environment...');
    
    // Register test user
    const timestamp = Date.now();
    const testUser = {
      email: `phase3-complete-${timestamp}@example.com`,
      password: 'Phase3Complete123!',
      fullName: 'Phase 3 Complete Test User',
      company: 'Phase 3 Complete Testing'
    };

    const registerResponse = await this.makeRequest('POST', '/api/v1/auth/register', testUser);
    this.assert(registerResponse.status === 201 || registerResponse.status === 200, 
      `Registration failed with status ${registerResponse.status}`);

    // Login to get token
    const loginResponse = await this.makeRequest('POST', '/api/v1/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    this.assert(loginResponse.status === 200, `Login failed with status ${loginResponse.status}`);
    this.authToken = loginResponse.data.data.token;
    this.organizationId = loginResponse.data.data.organizations && loginResponse.data.data.organizations[0] 
      ? loginResponse.data.data.organizations[0].id 
      : null;
    
    // Create test website
    const websiteResponse = await this.makeRequest('POST', '/api/v1/websites', {
      url: 'https://phase3-complete-test.com',
      name: 'Phase 3 Complete Test Website'
    });
    
    if (websiteResponse.status === 201 || websiteResponse.status === 200) {
      this.websiteId = websiteResponse.data.data.id;
    }
    
    this.log('SUCCESS', `Test environment setup completed`);
    this.log('INFO', `Organization ID: ${this.organizationId}`);
    this.log('INFO', `Website ID: ${this.websiteId || 'Not created'}`);
  }

  async runMLOptimizationTests() {
    this.log('INFO', '🤖 Starting ML Optimization Tests...');

    // Test 1: Get ML Models (GET)
    await this.test('ML Optimization - Get models', async () => {
      const response = await this.makeRequest('GET', '/api/v1/ml-optimization/models');
      this.assert(response.status === 200, `Expected 200, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      this.assert(Array.isArray(response.data.data), 'Should return array of models');
    });

    // Test 2: Generate Suggestions (POST)
    if (this.websiteId) {
      await this.test('ML Optimization - Generate suggestions', async () => {
        const response = await this.makeRequest('POST', '/api/v1/ml-optimization/suggestions/generate', {
          websiteId: this.websiteId,
          modelType: 'content_optimization',
          analysisDepth: 'detailed',
          focusAreas: ['content', 'technical']
        });
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
        if (response.data.data && response.data.data.length > 0) {
          this.createdResources.suggestions.push(...response.data.data.map(s => s.id));
        }
      });

      // Test 3: Get Suggestions (GET)
      await this.test('ML Optimization - Get suggestions', async () => {
        const response = await this.makeRequest('GET', '/api/v1/ml-optimization/suggestions?page=1&limit=10');
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
        this.assert(response.data.data.pagination, 'Should include pagination');
      });

      // Test 4: Get Suggestion by ID (GET)
      if (this.createdResources.suggestions.length > 0) {
        await this.test('ML Optimization - Get suggestion by ID', async () => {
          const suggestionId = this.createdResources.suggestions[0];
          const response = await this.makeRequest('GET', `/api/v1/ml-optimization/suggestions/${suggestionId}`);
          this.assert(response.status === 200, `Expected 200, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
        });

        // Test 5: Update Suggestion Status (PUT)
        await this.test('ML Optimization - Update suggestion status', async () => {
          const suggestionId = this.createdResources.suggestions[0];
          const response = await this.makeRequest('PUT', `/api/v1/ml-optimization/suggestions/${suggestionId}/status`, {
            status: 'reviewing',
            feedback: 'Under review by team'
          });
          this.assert(response.status === 200, `Expected 200, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
        });
      }
    }
  }

  async runIntegrationTests() {
    this.log('INFO', '🔌 Starting Integration Tests...');

    // Test 1: Get Integration Types (GET)
    await this.test('Integrations - Get integration types', async () => {
      const response = await this.makeRequest('GET', '/api/v1/integrations/types');
      this.assert(response.status === 200, `Expected 200, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      this.assert(Array.isArray(response.data.data), 'Should return array of integration types');
    });

    // Test 2: Create Slack Integration (POST)
    await this.test('Integrations - Create Slack integration', async () => {
      const response = await this.makeRequest('POST', '/api/v1/integrations', {
        integrationType: 'slack',
        name: 'Test Slack Integration',
        config: {
          channel: '#test-alerts',
          notifications: ['alerts', 'reports']
        }
      });
      this.assert(response.status === 201, `Expected 201, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      if (response.data.data && response.data.data.id) {
        this.createdResources.integrations.push(response.data.data.id);
      }
    });

    // Test 3: Get Integrations (GET)
    await this.test('Integrations - Get integrations list', async () => {
      const response = await this.makeRequest('GET', '/api/v1/integrations');
      this.assert(response.status === 200, `Expected 200, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      this.assert(Array.isArray(response.data.data), 'Should return array of integrations');
    });

    // Test 4: Update Integration (PUT)
    if (this.createdResources.integrations.length > 0) {
      await this.test('Integrations - Update integration', async () => {
        const integrationId = this.createdResources.integrations[0];
        const response = await this.makeRequest('PUT', `/api/v1/integrations/${integrationId}`, {
          name: 'Updated Slack Integration',
          isActive: false
        });
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });

      // Test 5: Test Integration (POST)
      await this.test('Integrations - Test integration', async () => {
        const integrationId = this.createdResources.integrations[0];
        const response = await this.makeRequest('POST', `/api/v1/integrations/${integrationId}/test`);
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });

      // Test 6: Delete Integration (DELETE)
      await this.test('Integrations - Delete integration', async () => {
        const integrationId = this.createdResources.integrations.pop();
        const response = await this.makeRequest('DELETE', `/api/v1/integrations/${integrationId}`);
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });
    }
  }

  async runWebhookTests() {
    this.log('INFO', '🪝 Starting Webhook Tests...');

    // Test 1: Create Webhook (POST)
    await this.test('Webhooks - Create webhook', async () => {
      const response = await this.makeRequest('POST', '/api/v1/integrations/webhooks', {
        name: 'Test Webhook',
        url: 'https://example.com/webhook',
        events: ['scan_completed', 'alert_triggered'],
        retryAttempts: 3,
        timeoutSeconds: 30
      });
      this.assert(response.status === 201, `Expected 201, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      if (response.data.data && response.data.data.id) {
        this.createdResources.webhooks.push(response.data.data.id);
      }
    });

    // Test 2: Get Webhooks (GET)
    await this.test('Webhooks - Get webhooks', async () => {
      const response = await this.makeRequest('GET', '/api/v1/integrations/webhooks');
      this.assert(response.status === 200, `Expected 200, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      this.assert(Array.isArray(response.data.data), 'Should return array of webhooks');
    });

    // Test 3: Update Webhook (PUT)
    if (this.createdResources.webhooks.length > 0) {
      await this.test('Webhooks - Update webhook', async () => {
        const webhookId = this.createdResources.webhooks[0];
        const response = await this.makeRequest('PUT', `/api/v1/integrations/webhooks/${webhookId}`, {
          name: 'Updated Webhook',
          isActive: false
        });
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });

      // Test 4: Test Webhook (POST)
      await this.test('Webhooks - Test webhook', async () => {
        const webhookId = this.createdResources.webhooks[0];
        const response = await this.makeRequest('POST', `/api/v1/integrations/webhooks/${webhookId}/test`, {
          testPayload: { message: 'Test webhook delivery' }
        });
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });

      // Test 5: Delete Webhook (DELETE)
      await this.test('Webhooks - Delete webhook', async () => {
        const webhookId = this.createdResources.webhooks.pop();
        const response = await this.makeRequest('DELETE', `/api/v1/integrations/webhooks/${webhookId}`);
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });
    }
  }

  async runABTestingTests() {
    this.log('INFO', '🧪 Starting A/B Testing Tests...');

    // Test 1: Create User Segment (POST)
    await this.test('A/B Testing - Create user segment', async () => {
      const response = await this.makeRequest('POST', '/api/v1/ab-testing/segments', {
        name: 'Test Segment',
        description: 'Test user segment',
        segmentCriteria: {
          location: 'US',
          deviceType: 'desktop'
        }
      });
      this.assert(response.status === 201, `Expected 201, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      if (response.data.data && response.data.data.id) {
        this.createdResources.segments.push(response.data.data.id);
      }
    });

    // Test 2: Get User Segments (GET)
    await this.test('A/B Testing - Get user segments', async () => {
      const response = await this.makeRequest('GET', '/api/v1/ab-testing/segments');
      this.assert(response.status === 200, `Expected 200, got ${response.status}`);
      this.assert(response.data.success, 'Response should indicate success');
      this.assert(Array.isArray(response.data.data), 'Should return array of segments');
    });

    // Test 3: Create Experiment (POST)
    if (this.websiteId) {
      await this.test('A/B Testing - Create experiment', async () => {
        const response = await this.makeRequest('POST', '/api/v1/ab-testing/experiments', {
          websiteId: this.websiteId,
          name: 'Test Experiment',
          description: 'Testing A/B experiment',
          experimentType: 'content_optimization',
          hypothesis: 'New design will improve conversion',
          successMetric: 'conversion_rate',
          targetMetricValue: 0.15
        });
        this.assert(response.status === 201, `Expected 201, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
        if (response.data.data && response.data.data.id) {
          this.createdResources.experiments.push(response.data.data.id);
        }
      });

      // Test 4: Get Experiments (GET)
      await this.test('A/B Testing - Get experiments', async () => {
        const response = await this.makeRequest('GET', '/api/v1/ab-testing/experiments');
        this.assert(response.status === 200, `Expected 200, got ${response.status}`);
        this.assert(response.data.success, 'Response should indicate success');
      });

      // Test 5: Create Variant (POST)
      if (this.createdResources.experiments.length > 0) {
        await this.test('A/B Testing - Create variant', async () => {
          const experimentId = this.createdResources.experiments[0];
          const response = await this.makeRequest('POST', '/api/v1/ab-testing/variants', {
            experimentId,
            name: 'Control Variant',
            variantType: 'control',
            configuration: {
              design: 'original'
            },
            trafficPercentage: 50
          });
          this.assert(response.status === 201, `Expected 201, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
          if (response.data.data && response.data.data.id) {
            this.createdResources.variants.push(response.data.data.id);
          }
        });

        // Test 6: Start Experiment (POST)
        await this.test('A/B Testing - Start experiment', async () => {
          const experimentId = this.createdResources.experiments[0];
          const response = await this.makeRequest('POST', `/api/v1/ab-testing/experiments/${experimentId}/start`);
          this.assert(response.status === 200, `Expected 200, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
        });

        // Test 7: Get Experiment Results (GET)
        await this.test('A/B Testing - Get experiment results', async () => {
          const experimentId = this.createdResources.experiments[0];
          const response = await this.makeRequest('GET', `/api/v1/ab-testing/experiments/${experimentId}/results`);
          this.assert(response.status === 200, `Expected 200, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
        });

        // Test 8: Stop Experiment (POST)
        await this.test('A/B Testing - Stop experiment', async () => {
          const experimentId = this.createdResources.experiments[0];
          const response = await this.makeRequest('POST', `/api/v1/ab-testing/experiments/${experimentId}/stop`);
          this.assert(response.status === 200, `Expected 200, got ${response.status}`);
          this.assert(response.data.success, 'Response should indicate success');
        });
      }
    }
  }

  async cleanupTestData() {
    this.log('INFO', '🧹 Cleaning up test data...');
    
    // Note: In a real implementation, you would delete all created resources
    // For now, we'll just log what would be cleaned up
    
    this.log('INFO', `Would clean up ${this.createdResources.suggestions.length} suggestions`);
    this.log('INFO', `Would clean up ${this.createdResources.integrations.length} integrations`);
    this.log('INFO', `Would clean up ${this.createdResources.webhooks.length} webhooks`);
    this.log('INFO', `Would clean up ${this.createdResources.workflows.length} workflows`);
    this.log('INFO', `Would clean up ${this.createdResources.experiments.length} experiments`);
    this.log('INFO', `Would clean up ${this.createdResources.variants.length} variants`);
    this.log('INFO', `Would clean up ${this.createdResources.segments.length} segments`);
  }

  async generateSummaryReport() {
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const successRate = ((passed / this.testResults.length) * 100).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log(`${this.colors.bright}${this.colors.cyan}📊 Phase 3 Complete Test Results Summary${this.colors.reset}`);
    console.log('='.repeat(60));
    console.log(`Total tests: ${this.testResults.length}`);
    console.log(`${this.colors.green}✅ Passed: ${passed}${this.colors.reset}`);
    console.log(`${this.colors.red}❌ Failed: ${failed}${this.colors.reset}`);
    console.log(`${this.colors.bright}📈 Success rate: ${successRate}%${this.colors.reset}`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log(`\n${this.colors.red}Failed tests:${this.colors.reset}`);
      this.testResults.filter(r => r.status === 'FAILED').forEach(test => {
        console.log(`❌ ${test.name}: ${test.error}`);
      });
    }

    if (passed === this.testResults.length) {
      console.log(`\n${this.colors.green}🎉 All tests passed successfully!${this.colors.reset}`);
      console.log(`\n${this.colors.cyan}✨ Phase 3 APIs are fully functional with real database operations!${this.colors.reset}`);
    }
  }

  async run() {
    console.log(`${this.colors.bright}${this.colors.magenta}🚀 Phase 3 Complete API Testing Suite${this.colors.reset}`);
    console.log(`${this.colors.blue}📡 Target API: ${this.apiUrl}${this.colors.reset}`);
    console.log('='.repeat(60));
    
    this.startTime = Date.now();

    try {
      await this.setupTestEnvironment();
      await this.runMLOptimizationTests();
      await this.runIntegrationTests();
      await this.runWebhookTests();
      await this.runABTestingTests();
      await this.cleanupTestData();
    } catch (error) {
      this.log('ERROR', `Test execution failed: ${error.message}`);
    }

    await this.generateSummaryReport();
    
    const executionTime = Date.now() - this.startTime;
    console.log(`\n⏱️  Total execution time: ${executionTime}ms`);
  }
}

// Run the tests
const apiUrl = process.env.API_URL || 'http://localhost:8000';
const tester = new Phase3CompleteTester(apiUrl);
tester.run().catch(console.error);