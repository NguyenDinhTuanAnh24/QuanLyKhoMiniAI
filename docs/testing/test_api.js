const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- STARTING INTEGRATION TESTS ---');
  let passed = 0;
  let failed = 0;

  const check = (name, condition) => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.log(`[FAIL] ${name}`);
      failed++;
    }
  };

  // 1. Health check (if exists)
  try {
    const res = await axios.get(`${BASE_URL}/health`);
    check('Health Check Endpoint (200)', res.status === 200);
  } catch (err) {
    console.log('[NOT TESTED / FAIL] Health endpoint missing or error:', err.message);
  }

  // 2. Login with missing data
  try {
    await axios.post(`${BASE_URL}/auth/login`, {});
    check('Login with empty data', false); // should fail
  } catch (err) {
    check('Login with empty data returns error', err.response?.status === 400 || err.response?.status === 404 || err.response?.status === 401);
  }

  // 3. Test unauthenticated request to protected route
  try {
    await axios.get(`${BASE_URL}/products`);
    check('Unauthenticated access to /products', false);
  } catch (err) {
    check('Unauthenticated access to /products returns 401', err.response?.status === 401);
  }

  // 4. Try getting a token from DB? We can't easily do that without knowing credentials.
  console.log(`--- TESTS COMPLETED: ${passed} PASS, ${failed} FAIL ---`);
}

runTests();
