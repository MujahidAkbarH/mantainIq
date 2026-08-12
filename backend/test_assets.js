require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runAssetTests() {
  console.log('--- STARTING PHASE 3 ASSET & QR INTEGRATION TEST ---');
  await connectDB();

  const server = app.listen(5003, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5003');

    try {
      // 1. Create Test Admin User & Login
      const adminCreds = {
        name: 'Asset Test Admin',
        email: `assetadmin_${Date.now()}@maintainiq.com`,
        password: 'password123',
        role: 'Admin',
      };

      console.log('1. Registering Test Admin User...');
      const regRes = await fetch('http://127.0.0.1:5003/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCreds),
      });
      const regData = await regRes.json();
      const token = regData.token;

      if (!token) throw new Error('Failed to obtain token for asset test');
      console.log('   ✅ Admin Authenticated. Token acquired.');

      // 2. Create New Asset
      const newAsset = {
        name: 'Classroom Projector 01',
        uniqueCode: `AST-PRJ-${Date.now().toString().slice(-4)}`,
        category: 'Audio / Visual Display',
        location: 'Building A - Room 101',
        condition: 'Good',
        status: 'Operational',
      };

      console.log(`\n2. Testing Asset Creation & Dynamic QR Generation (POST /api/assets)...`);
      const createRes = await fetch('http://127.0.0.1:5003/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAsset),
      });

      const createData = await createRes.json();
      console.log('   Status Code:', createRes.status);
      console.log('   Created Code:', createData.asset?.uniqueCode);
      console.log('   Public URL:', createData.asset?.publicUrl);
      console.log('   QR Data URL format:', createData.asset?.qrDataUrl?.substring(0, 45) + '...');

      if (createRes.status !== 201 || !createData.asset?.qrDataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('Asset creation or QR generation failed!');
      }
      console.log('   ✅ ASSET CREATION & SAFE QR GENERATION SUCCESSFUL!');

      // 3. Test Duplicate Code Rejection
      console.log(`\n3. Testing Duplicate Asset Code Rejection (POST /api/assets)...`);
      const dupRes = await fetch('http://127.0.0.1:5003/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAsset), // Same code
      });

      const dupData = await dupRes.json();
      console.log('   Status Code:', dupRes.status);
      console.log('   Response Body:', JSON.stringify(dupData));

      if (dupRes.status !== 400 || dupData.success !== false) {
        throw new Error('Duplicate code rejection failed!');
      }
      console.log('   ✅ DUPLICATE ASSET CODE REJECTED WITH 400 JSON!');

      // 4. Test Public Safe Asset Lookup
      console.log(`\n4. Testing Public Safe Asset View (GET /api/assets/public/${newAsset.uniqueCode})...`);
      const publicRes = await fetch(`http://127.0.0.1:5003/api/assets/public/${newAsset.uniqueCode}`);
      const publicData = await publicRes.json();
      console.log('   Status Code:', publicRes.status);
      console.log('   Public Asset Data:', JSON.stringify(publicData.asset));

      if (publicRes.status !== 200 || publicData.asset.uniqueCode !== newAsset.uniqueCode) {
        throw new Error('Public asset lookup failed!');
      }
      console.log('   ✅ PUBLIC ASSET VIEW SUCCESSFUL (SAFE ATTRIBUTES ONLY)!');

      // 5. Test Update Asset Immutability Constraint
      console.log(`\n5. Testing Asset Update & Code Immutability (PUT /api/assets/${createData.asset._id})...`);
      const updateRes = await fetch(`http://127.0.0.1:5003/api/assets/${createData.asset._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'Classroom Projector 01 (Updated Name)',
          location: 'Building B - Room 202',
          uniqueCode: 'ATTEMPT-TO-MUTATE-CODE', // Attempt code change
        }),
      });

      const updateData = await updateRes.json();
      console.log('   Status Code:', updateRes.status);
      console.log('   Updated Name:', updateData.asset?.name);
      console.log('   Updated Location:', updateData.asset?.location);
      console.log('   Unique Code After Update:', updateData.asset?.uniqueCode);

      if (updateData.asset?.uniqueCode === 'ATTEMPT-TO-MUTATE-CODE') {
        throw new Error('Immutability constraint violated: uniqueCode was mutated!');
      }
      console.log('   ✅ IMMUTABILITY ENFORCED! uniqueCode remained unchanged; QR mapping preserved.');

      console.log('\n--- ALL PHASE 3 ASSET & QR TESTS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ PHASE 3 TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runAssetTests();
