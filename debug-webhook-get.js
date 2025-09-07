const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api/v1';

async function debugWebhookGet() {
  try {
    console.log('🔧 Debugging Webhook GET Endpoint');
    console.log('==================================');

    // Step 1: Register user
    const testEmail = `debug-webhook-${Date.now()}@test.com`;
    console.log('1. Registering test user...');
    
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: testEmail,
      password: 'TestPassword123!',
      fullName: 'Webhook Debug Test',
      company: 'Debug Company'
    });
    
    console.log(`✅ Register status: ${registerResponse.status}`);

    // Step 2: Login to get token
    console.log('2. Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: 'TestPassword123!'
    });
    
    const token = loginResponse.data.data.token;
    const organizationId = loginResponse.data.data.organizations[0].id;
    console.log(`✅ Login status: ${loginResponse.status}`);
    console.log(`🏢 Organization ID: ${organizationId}`);

    // Step 3: Create a webhook first
    console.log('3. Creating webhook...');
    const createWebhookResponse = await axios.post(`${API_BASE_URL}/integrations/webhooks`, {
      name: 'Debug Webhook',
      url: 'https://debug.example.com/webhook',
      events: ['scan_completed', 'alert_triggered']
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Create webhook status: ${createWebhookResponse.status}`);
    console.log(`📊 Created webhook response:`, JSON.stringify(createWebhookResponse.data, null, 2));

    // Step 4: Get webhooks - THE FAILING TEST
    console.log('4. Getting webhooks (the failing test)...');
    const getWebhooksResponse = await axios.get(`${API_BASE_URL}/integrations/webhooks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`📊 Get webhooks status: ${getWebhooksResponse.status}`);
    console.log(`📊 Get webhooks response:`, JSON.stringify(getWebhooksResponse.data, null, 2));
    
    // Analyze the response
    console.log('\n🔍 Response Analysis:');
    console.log(`- success field: ${getWebhooksResponse.data.success}`);
    console.log(`- data field exists: ${!!getWebhooksResponse.data.data}`);
    console.log(`- data is array: ${Array.isArray(getWebhooksResponse.data.data)}`);
    if (Array.isArray(getWebhooksResponse.data.data)) {
      console.log(`- array length: ${getWebhooksResponse.data.data.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugWebhookGet();