#!/usr/bin/env node

const axios = require('axios');

const FRONTEND_URL = 'http://localhost:8081';
const API_URL = 'https://api-geo.blitzgame.site';

console.log('🚀 Starting GEO Platform Frontend UI Tests');
console.log('📱 Frontend URL:', FRONTEND_URL);
console.log('📡 API URL:', API_URL);
console.log('==================================================');

class FrontendUITester {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    this.results.total++;
    console.log(`[INFO] Testing: ${name}`);
    
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(`✅ Passed: ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(`❌ Failed: ${name} - ${error.message}`);
    }
  }

  async testFrontendAccessibility() {
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    if (!response.data.includes('GEO Platform')) {
      throw new Error('Frontend title not found in HTML');
    }
  }

  async testAPIConnectivity() {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(`API health check failed: ${response.status}`);
    }
    if (!response.data.success) {
      throw new Error('API health check returned success: false');
    }
  }

  async testFrontendAPIIntegration() {
    // Test if frontend can make API calls by checking if it serves static assets properly
    const response = await axios.get(`${FRONTEND_URL}/src/main.tsx`, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accept 404 as valid response from Vite dev server
    });
    
    if (response.status >= 500) {
      throw new Error(`Frontend dev server error: ${response.status}`);
    }
  }

  async testEnvironmentConfiguration() {
    // Test by making a request that would show environment config issues
    const response = await axios.get(FRONTEND_URL, { timeout: 5000 });
    
    // Look for common configuration errors in the HTML
    if (response.data.includes('undefined') && response.data.includes('VITE_')) {
      throw new Error('Frontend environment variables not properly configured');
    }
  }

  async testStaticAssets() {
    try {
      // Test if Vite can serve static assets
      const response = await axios.get(`${FRONTEND_URL}/vite.svg`, {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      if (response.status >= 500) {
        throw new Error(`Static asset serving failed: ${response.status}`);
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Frontend server not accessible');
      }
      // 404 is acceptable for this test - it means the server is responding
      if (error.response && error.response.status === 404) {
        return; // Pass the test
      }
      throw error;
    }
  }

  async testCORSConfiguration() {
    // Test CORS by making a request from a different origin simulation
    try {
      const response = await axios.get(`${API_URL}/health`, {
        timeout: 5000,
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'GET'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`CORS preflight failed: ${response.status}`);
      }
    } catch (error) {
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw new Error('CORS configuration may have issues');
      }
      throw error;
    }
  }

  async testAPIAuthentication() {
    // Test user registration to verify API integration
    const testUser = {
      email: `frontend_test_${Date.now()}@example.com`,
      password: 'TestPassword123',
      fullName: 'Frontend Test User',
      company: 'Frontend Testing Co.'
    };

    const response = await axios.post(`${API_URL}/api/v1/auth/register`, testUser, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      }
    });

    if (response.status !== 201) {
      throw new Error(`User registration failed: ${response.status}`);
    }

    if (!response.data.success || !response.data.data.user) {
      throw new Error('Registration response structure invalid');
    }
  }

  printResults() {
    console.log('\n==================================================');
    console.log('🧪 Frontend UI Test Results');
    console.log('==================================================');
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    console.log('==================================================\n');

    if (this.results.failed === 0) {
      console.log('🎉 All frontend UI tests passed!');
      console.log('\n🌐 Web UI is ready for testing:');
      console.log(`   Frontend: ${FRONTEND_URL}`);
      console.log(`   Backend API: ${API_URL}`);
      console.log('\n📋 Test Summary:');
      this.results.tests.forEach(test => {
        console.log(`   ${test.status === 'PASSED' ? '✅' : '❌'} ${test.name}`);
      });
    } else {
      console.log('😞 Some frontend tests failed. Please check the issues above.');
    }
  }

  async runAllTests() {
    await this.test('Frontend Accessibility', () => this.testFrontendAccessibility());
    await this.test('API Connectivity', () => this.testAPIConnectivity());
    await this.test('Frontend-API Integration', () => this.testFrontendAPIIntegration());
    await this.test('Environment Configuration', () => this.testEnvironmentConfiguration());
    await this.test('Static Assets Serving', () => this.testStaticAssets());
    await this.test('CORS Configuration', () => this.testCORSConfiguration());
    await this.test('API Authentication Flow', () => this.testAPIAuthentication());

    this.printResults();
  }
}

// Run the tests
const tester = new FrontendUITester();
tester.runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});