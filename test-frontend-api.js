// Test script to verify frontend API client configuration
const axios = require('axios');

console.log('🧪 Testing Frontend API Configuration...');

// Test the API endpoints the frontend would call
const API_BASE = 'http://10.74.100.10:8000/api/v1';

async function testAPIs() {
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health OK:', healthResponse.status);

    // Test team roles endpoint (this is the one failing in browser)
    console.log('2. Testing team/roles endpoint...');
    try {
      const rolesResponse = await axios.get(`${API_BASE}/team/roles`);
      console.log('✅ Team roles OK:', rolesResponse.status);
    } catch (error) {
      console.log('❌ Team roles failed:', error.response?.status || error.message);
    }

    // Test team members endpoint
    console.log('3. Testing team/members endpoint...');
    try {
      const membersResponse = await axios.get(`${API_BASE}/team/members?page=1&limit=10`);
      console.log('✅ Team members OK:', membersResponse.status);  
    } catch (error) {
      console.log('❌ Team members failed:', error.response?.status || error.message);
    }

    console.log('\n🎉 API connectivity test completed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPIs();