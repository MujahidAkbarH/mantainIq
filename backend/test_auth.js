require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runTests() {
  console.log('--- STARTING AUTHENTICATION INTEGRATION TEST ---');
  await connectDB();

  const server = app.listen(5002, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5002');

    try {
      const testUser = {
        name: 'Test Admin User',
        email: `testadmin_${Date.now()}@maintainiq.com`,
        password: 'password123',
        role: 'Admin',
      };

      console.log('1. Testing Registration Endpoint (POST /api/auth/register)...');
      const regRes = await fetch('http://127.0.0.1:5002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const regData = await regRes.json();
      console.log('   Status Code:', regRes.status);
      console.log('   Response Body:', JSON.stringify(regData));

      if (regRes.status !== 201 || !regData.success || !regData.token) {
        throw new Error('Registration test failed!');
      }
      console.log('   ✅ REGISTRATION SUCCESSFUL!');

      console.log('\n2. Testing Login Endpoint (POST /api/auth/login)...');
      const loginRes = await fetch('http://127.0.0.1:5002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });

      const loginData = await loginRes.json();
      console.log('   Status Code:', loginRes.status);
      console.log('   Response Body:', JSON.stringify(loginData));

      if (loginRes.status !== 200 || !loginData.success || !loginData.token) {
        throw new Error('Login test failed!');
      }
      console.log('   ✅ LOGIN SUCCESSFUL!');

      console.log('\n3. Testing Protected User Endpoint (GET /api/auth/me)...');
      const meRes = await fetch('http://127.0.0.1:5002/api/auth/me', {
        headers: { Authorization: `Bearer ${loginData.token}` },
      });

      const meData = await meRes.json();
      console.log('   Status Code:', meRes.status);
      console.log('   Response Body:', JSON.stringify(meData));

      if (meRes.status !== 200 || meData.user.email !== testUser.email) {
        throw new Error('/api/auth/me test failed!');
      }
      console.log('   ✅ ME ENDPOINT SUCCESSFUL!');

      console.log('\n4. Testing Duplicate Email Handling (POST /api/auth/register)...');
      const dupRes = await fetch('http://127.0.0.1:5002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });

      const dupData = await dupRes.json();
      console.log('   Status Code:', dupRes.status);
      console.log('   Response Body:', JSON.stringify(dupData));

      if (dupRes.status === 400 && dupData.success === false) {
        console.log('   ✅ DUPLICATE EMAIL REJECTED WITH JSON SUCCESSFULLY!');
      } else {
        throw new Error('Duplicate email test failed!');
      }

      console.log('\n--- ALL AUTHENTICATION TESTS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runTests();
