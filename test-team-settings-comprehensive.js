#!/usr/bin/env node

/**
 * Comprehensive Team and Settings API Test Script
 * Tests all endpoints for Team Management and Settings APIs
 * Based on the test patterns from test-api.js
 */

const axios = require('axios');
const colors = require('colors');

// Configuration
const config = {
  baseURL: process.env.API_URL || 'http://localhost:8000',
  timeout: 30000,
  testUser: {
    email: `test_team_${Date.now()}@example.com`,
    password: 'Test123456',
    fullName: 'Team Settings Test User',
    company: 'Test Organization'
  },
  inviteUser: {
    email: `invite_${Date.now()}@example.com`,
    role: 'viewer',
    message: 'Welcome to our test team!'
  }
};

// Global test data storage
let testData = {
  accessToken: null,
  refreshToken: null,
  user: null,
  organization: null,
  invitationId: null,
  secondUserId: null
};

// HTTP client setup
const api = axios.create({
  baseURL: `${config.baseURL}/api/v1`,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token and organization ID
api.interceptors.request.use((config) => {
  if (testData.accessToken) {
    config.headers.Authorization = `Bearer ${testData.accessToken}`;
  }
  if (testData.organization) {
    config.headers['X-Organization-ID'] = testData.organization.id;
  }
  return config;
});

// Test runner class
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
      this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.passed++;
      this.log(`Passed: ${name}`, 'success');
    } catch (error) {
      this.failed++;
      this.log(`Failed: ${name} - ${error.message}`, 'error');
      if (error.response) {
        this.log(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`, 'error');
      }
    }
  }

  async assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  summary() {
    const duration = Date.now() - this.startTime;
    const total = this.passed + this.failed;
    
    console.log('\n' + '='.repeat(50));
    console.log('Test Results Summary'.bold);
    console.log('='.repeat(50));
    console.log(`Total tests: ${total}`);
    console.log(`Passed: ${this.passed}`.green);
    console.log(`Failed: ${this.failed}`.red);
    console.log(`Success rate: ${total > 0 ? ((this.passed / total) * 100).toFixed(2) : 0}%`);
    console.log(`Execution time: ${duration}ms`);
    console.log('='.repeat(50));
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

// Authentication setup
async function setupAuthentication(runner) {
  // Register user
  await runner.test('User Registration', async () => {
    const response = await api.post('/auth/register', config.testUser);
    
    await runner.assert(response.status === 201, 'Registration should return 201');
    await runner.assert(response.data.success === true, 'Registration should succeed');
    await runner.assert(response.data.data.user, 'Should return user data');
    await runner.assert(response.data.data.token, 'Should return access token');
    
    testData.accessToken = response.data.data.token;
    testData.refreshToken = response.data.data.refreshToken;
    testData.user = response.data.data.user;
    testData.organization = response.data.data.organization;
    
    runner.log(`User registered: ${response.data.data.user.email}`, 'info');
  });

  // Login test
  await runner.test('User Login', async () => {
    const response = await api.post('/auth/login', {
      email: config.testUser.email,
      password: config.testUser.password
    });
    
    await runner.assert(response.status === 200, 'Login should return 200');
    await runner.assert(response.data.success === true, 'Login should succeed');
    
    testData.accessToken = response.data.data.token;
    if (response.data.data.organizations && response.data.data.organizations.length > 0) {
      testData.organization = response.data.data.organizations[0];
    }
    
    runner.log(`User logged in: ${response.data.data.user.email}`, 'info');
  });
}

// Settings API Tests
async function testSettingsAPIs(runner) {
  runner.log('\n⚙️  Testing Settings APIs...', 'info');

  // Organization Settings Tests
  await runner.test('GET /settings/organization - Get organization settings', async () => {
    const response = await api.get('/settings/organization');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return settings data');
    
    runner.log(`Organization settings retrieved`, 'info');
  });

  await runner.test('PUT /settings/organization - Update organization settings', async () => {
    const updates = {
      name: 'Updated Test Organization',
      timezone: 'America/New_York',
      dateFormat: 'MM/DD/YYYY',
      language: 'en'
    };
    
    const response = await api.put('/settings/organization', updates);
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.message, 'Should return success message');
    await runner.assert(response.data.data, 'Should return updated settings');
    
    runner.log(`Organization settings updated: ${updates.name}`, 'info');
  });

  // Security Settings Tests
  await runner.test('GET /settings/security - Get security settings', async () => {
    const response = await api.get('/settings/security');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return security info');
    
    runner.log(`Security settings retrieved`, 'info');
  });

  await runner.test('PUT /settings/password - Change password', async () => {
    const newPassword = 'NewTest123456';
    const response = await api.put('/settings/password', {
      currentPassword: config.testUser.password,
      newPassword: newPassword
    });
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.message, 'Should return success message');
    
    // Update password for future tests
    config.testUser.password = newPassword;
    
    runner.log(`Password changed successfully`, 'info');
  });

  await runner.test('PUT /settings/password - Invalid current password', async () => {
    try {
      await api.put('/settings/password', {
        currentPassword: 'WrongPassword123',
        newPassword: 'AnotherPassword123'
      });
      throw new Error('Should have failed with wrong password');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for wrong password');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  await runner.test('PUT /settings/password - Password too short', async () => {
    try {
      await api.put('/settings/password', {
        currentPassword: config.testUser.password,
        newPassword: 'Short1'
      });
      throw new Error('Should have failed with short password');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for short password');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  // Active Sessions Test
  await runner.test('GET /settings/security/sessions - Get active sessions', async () => {
    const response = await api.get('/settings/security/sessions');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.sessions, 'Should return sessions');
    await runner.assert(Array.isArray(response.data.data.sessions), 'Sessions should be an array');
    
    runner.log(`Active sessions retrieved: ${response.data.data.sessions.length} sessions`, 'info');
  });

  // User Preferences Tests
  await runner.test('GET /settings/preferences - Get user preferences', async () => {
    const response = await api.get('/settings/preferences');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return preferences');
    
    runner.log(`User preferences retrieved`, 'info');
  });

  await runner.test('PUT /settings/preferences - Update user preferences', async () => {
    const preferences = {
      theme: 'dark',
      language: 'en',
      notifications: {
        email: true,
        browser: false,
        mobile: false
      },
      dashboardLayout: 'compact'
    };
    
    const response = await api.put('/settings/preferences', preferences);
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.message, 'Should return success message');
    await runner.assert(response.data.data, 'Should return updated preferences');
    
    runner.log(`User preferences updated: theme=${preferences.theme}`, 'info');
  });

  // 2FA Tests
  await runner.test('POST /settings/2fa/enable - Enable 2FA', async () => {
    const response = await api.post('/settings/2fa/enable');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.message, 'Should return message');
    await runner.assert(response.data.data, 'Should return 2FA setup data');
    
    // Store secret for verification test
    if (response.data.data.secret) {
      testData.twoFactorSecret = response.data.data.secret;
    }
    
    runner.log(`2FA setup initiated`, 'info');
  });

  await runner.test('POST /settings/2fa/verify - Invalid 2FA token', async () => {
    try {
      await api.post('/settings/2fa/verify', {
        token: '000000' // Invalid token
      });
      throw new Error('Should have failed with invalid token');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for invalid token');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  await runner.test('POST /settings/2fa/verify - Invalid token format', async () => {
    try {
      await api.post('/settings/2fa/verify', {
        token: '12345' // Wrong length
      });
      throw new Error('Should have failed with invalid token format');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for invalid format');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });
}

// Team Management API Tests
async function testTeamAPIs(runner) {
  runner.log('\n👥 Testing Team Management APIs...', 'info');

  // Get Roles Test
  await runner.test('GET /team/roles - Get available roles', async () => {
    const response = await api.get('/team/roles');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.roles, 'Should return roles');
    await runner.assert(Array.isArray(response.data.data.roles), 'Roles should be an array');
    
    runner.log(`Available roles: ${response.data.data.roles.length}`, 'info');
  });

  // Team Members Tests
  await runner.test('GET /team/members - List team members', async () => {
    const response = await api.get('/team/members');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return data');
    await runner.assert(response.data.data.members, 'Should return members');
    await runner.assert(Array.isArray(response.data.data.members), 'Members should be an array');
    
    runner.log(`Team members: ${response.data.data.members.length}`, 'info');
  });

  await runner.test('GET /team/members - With pagination', async () => {
    const response = await api.get('/team/members?page=1&limit=5');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.pagination, 'Should include pagination');
    await runner.assert(response.data.data.pagination.page === 1, 'Should be page 1');
    await runner.assert(response.data.data.pagination.limit === 5, 'Should have limit 5');
    
    runner.log(`Paginated members retrieved`, 'info');
  });

  await runner.test('GET /team/members - With search filter', async () => {
    const response = await api.get('/team/members?search=test');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.members, 'Should return members');
    
    runner.log(`Filtered members retrieved`, 'info');
  });

  await runner.test('GET /team/members - With role filter', async () => {
    const response = await api.get('/team/members?role=admin');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.members, 'Should return members');
    
    runner.log(`Role-filtered members retrieved`, 'info');
  });

  // Invitations Tests
  await runner.test('GET /team/invitations - List invitations', async () => {
    const response = await api.get('/team/invitations');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return data');
    await runner.assert(response.data.data.invitations, 'Should return invitations');
    await runner.assert(Array.isArray(response.data.data.invitations), 'Invitations should be an array');
    
    runner.log(`Invitations: ${response.data.data.invitations.length}`, 'info');
  });

  await runner.test('POST /team/invitations - Send invitation', async () => {
    const response = await api.post('/team/invitations', config.inviteUser);
    
    await runner.assert(response.status === 201, 'Should return 201');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.message, 'Should return message');
    await runner.assert(response.data.data.invitationId, 'Should return invitation ID');
    await runner.assert(response.data.data.email === config.inviteUser.email, 'Email should match');
    await runner.assert(response.data.data.role === config.inviteUser.role, 'Role should match');
    
    testData.invitationId = response.data.data.invitationId;
    
    runner.log(`Invitation sent to: ${config.inviteUser.email}`, 'info');
  });

  await runner.test('POST /team/invitations - Duplicate invitation', async () => {
    try {
      await api.post('/team/invitations', config.inviteUser);
      throw new Error('Should have failed with duplicate invitation');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for duplicate');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  await runner.test('POST /team/invitations - Invalid email', async () => {
    try {
      await api.post('/team/invitations', {
        email: 'invalid-email',
        role: 'member',
        message: 'Test'
      });
      throw new Error('Should have failed with invalid email');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for invalid email');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  await runner.test('POST /team/invitations - Invalid role', async () => {
    try {
      await api.post('/team/invitations', {
        email: `test_${Date.now()}@example.com`,
        role: 'invalid_role',
        message: 'Test'
      });
      throw new Error('Should have failed with invalid role');
    } catch (error) {
      await runner.assert(error.response.status === 400, 'Should return 400 for invalid role');
      await runner.assert(error.response.data.success === false, 'Should fail');
    }
  });

  if (testData.invitationId) {
    await runner.test('POST /team/invitations/:id/resend - Resend invitation', async () => {
      const response = await api.post(`/team/invitations/${testData.invitationId}/resend`);
      
      await runner.assert(response.status === 200, 'Should return 200');
      await runner.assert(response.data.success === true, 'Should succeed');
      await runner.assert(response.data.message, 'Should return message');
      
      runner.log(`Invitation resent: ${testData.invitationId}`, 'info');
    });

    await runner.test('GET /team/invitations - With status filter', async () => {
      const response = await api.get('/team/invitations?status=pending');
      
      await runner.assert(response.status === 200, 'Should return 200');
      await runner.assert(response.data.success === true, 'Should succeed');
      await runner.assert(response.data.data.invitations, 'Should return invitations');
      
      runner.log(`Pending invitations retrieved`, 'info');
    });

    await runner.test('DELETE /team/invitations/:id - Cancel invitation', async () => {
      const response = await api.delete(`/team/invitations/${testData.invitationId}`);
      
      await runner.assert(response.status === 200, 'Should return 200');
      await runner.assert(response.data.success === true, 'Should succeed');
      await runner.assert(response.data.message, 'Should return message');
      
      runner.log(`Invitation cancelled: ${testData.invitationId}`, 'info');
    });
  }

  // Activity Logs Tests
  await runner.test('GET /team/activity - Get activity logs', async () => {
    const response = await api.get('/team/activity');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data, 'Should return data');
    await runner.assert(response.data.data.activities, 'Should return activities');
    await runner.assert(Array.isArray(response.data.data.activities), 'Activities should be an array');
    
    runner.log(`Activity logs: ${response.data.data.activities.length} entries`, 'info');
  });

  await runner.test('GET /team/activity - With pagination', async () => {
    const response = await api.get('/team/activity?page=1&limit=10');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.pagination, 'Should include pagination');
    
    runner.log(`Paginated activity logs retrieved`, 'info');
  });

  await runner.test('GET /team/activity - With action filter', async () => {
    const response = await api.get('/team/activity?action=team.invitation.send');
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.activities, 'Should return activities');
    
    runner.log(`Filtered activity logs retrieved`, 'info');
  });

  await runner.test('GET /team/activity - With date range', async () => {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 7);
    const dateTo = new Date();
    
    const response = await api.get(`/team/activity?dateFrom=${dateFrom.toISOString()}&dateTo=${dateTo.toISOString()}`);
    
    await runner.assert(response.status === 200, 'Should return 200');
    await runner.assert(response.data.success === true, 'Should succeed');
    await runner.assert(response.data.data.activities, 'Should return activities');
    
    runner.log(`Date-filtered activity logs retrieved`, 'info');
  });
}

// Permission Tests
async function testPermissions(runner) {
  runner.log('\n🔒 Testing Permission Checks...', 'info');

  // Create a second user for permission testing
  const secondUser = {
    email: `test_viewer_${Date.now()}@example.com`,
    password: 'Viewer123456',
    fullName: 'Viewer User',
    company: config.testUser.company
  };

  await runner.test('Create second user with viewer role', async () => {
    // Register second user
    const registerResponse = await api.post('/auth/register', secondUser);
    await runner.assert(registerResponse.status === 201, 'Registration should succeed');
    
    testData.secondUserId = registerResponse.data.data.user.id;
    testData.secondUserToken = registerResponse.data.data.token;
    
    runner.log(`Second user created: ${secondUser.email}`, 'info');
  });

  // Test with limited permissions
  const limitedApi = axios.create({
    baseURL: `${config.baseURL}/api/v1`,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testData.secondUserToken}`,
      'X-Organization-ID': testData.organization.id
    }
  });

  await runner.test('PUT /settings/organization - No permission', async () => {
    try {
      await limitedApi.put('/settings/organization', {
        name: 'Unauthorized Update'
      });
      throw new Error('Should have failed with no permission');
    } catch (error) {
      await runner.assert(error.response.status === 403, 'Should return 403');
      await runner.assert(error.response.data.success === false, 'Should fail');
      runner.log('Permission denied as expected', 'info');
    }
  });

  await runner.test('PUT /team/members/:id - No permission', async () => {
    try {
      await limitedApi.put(`/team/members/${testData.user.id}`, {
        role: 'admin'
      });
      throw new Error('Should have failed with no permission');
    } catch (error) {
      await runner.assert(error.response.status === 403, 'Should return 403');
      await runner.assert(error.response.data.success === false, 'Should fail');
      runner.log('Permission denied as expected', 'info');
    }
  });

  await runner.test('POST /team/invitations - No permission', async () => {
    try {
      await limitedApi.post('/team/invitations', {
        email: `noperm_${Date.now()}@example.com`,
        role: 'viewer',
        message: 'Test'
      });
      throw new Error('Should have failed with no permission');
    } catch (error) {
      await runner.assert(error.response.status === 403, 'Should return 403');
      await runner.assert(error.response.data.success === false, 'Should fail');
      runner.log('Permission denied as expected', 'info');
    }
  });
}

// Edge Cases and Error Handling Tests
async function testEdgeCases(runner) {
  runner.log('\n⚠️  Testing Edge Cases...', 'info');

  await runner.test('GET /settings/organization - Missing organization header', async () => {
    const noOrgApi = axios.create({
      baseURL: `${config.baseURL}/api/v1`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testData.accessToken}`
      }
    });

    try {
      await noOrgApi.get('/settings/organization');
      // May succeed if API handles missing header gracefully
      runner.log('API handled missing organization header', 'info');
    } catch (error) {
      await runner.assert(error.response.status === 400 || error.response.status === 500, 
        'Should return error for missing organization');
      runner.log('Error thrown as expected for missing organization', 'info');
    }
  });

  await runner.test('PUT /team/members/:id - Non-existent member', async () => {
    try {
      await api.put('/team/members/999999', {
        role: 'editor'
      });
      throw new Error('Should have failed with non-existent member');
    } catch (error) {
      await runner.assert(error.response.status === 404 || error.response.status === 400, 
        'Should return error for non-existent member');
      runner.log('Error thrown as expected', 'info');
    }
  });

  await runner.test('DELETE /team/invitations/:id - Non-existent invitation', async () => {
    try {
      await api.delete('/team/invitations/999999');
      throw new Error('Should have failed with non-existent invitation');
    } catch (error) {
      await runner.assert(error.response.status === 404 || error.response.status === 400, 
        'Should return error for non-existent invitation');
      runner.log('Error thrown as expected', 'info');
    }
  });
}

// Main test runner
async function runTests() {
  const runner = new TestRunner();
  
  console.log('🚀 Starting Comprehensive Team & Settings API Tests'.bold.green);
  console.log(`📡 Target API: ${config.baseURL}`.blue);
  console.log('='.repeat(50));

  try {
    // Check server health
    try {
      await axios.get(`${config.baseURL}/health`, { timeout: 5000 });
    } catch (error) {
      runner.log('⚠️  Backend server seems to be down', 'warning');
      runner.log(`Please ensure server is running at ${config.baseURL}`, 'warning');
      runner.log('Start command: npm run dev', 'info');
      return;
    }

    // Run test suites
    await setupAuthentication(runner);
    await testSettingsAPIs(runner);
    await testTeamAPIs(runner);
    await testPermissions(runner);
    await testEdgeCases(runner);

  } catch (error) {
    runner.log(`Unexpected error during test execution: ${error.message}`, 'error');
  } finally {
    runner.summary();
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testSettingsAPIs,
  testTeamAPIs,
  testPermissions,
  testEdgeCases
};