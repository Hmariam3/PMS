import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

async function testRoutes() {
  console.log('Testing routes...\n');
  
  const routes = [
    '/staff-loan-requests',
    '/staff-loan-requests/statistics',
    '/staff-loan-requests/employee-scoring/12345',
  ];
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${API_URL}${route}`);
      console.log(`✅ ${route}`);
      console.log(`   Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${route}`);
      console.log(`   Status: ${error.response?.status || 'No response'}`);
      console.log(`   Error: ${error.message}`);
    }
    console.log();
  }
}

testRoutes();
